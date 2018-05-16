import {throwError as observableThrowError,  Observable } from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import * as _ from 'lodash';
import { Injectable } from '@angular/core';
import {
  HttpClient, HttpResponse, HttpRequest, HttpHeaders, HttpErrorResponse
} from '@angular/common/http';
import { JsonApiModel } from '../models/json-api.model';
import { ErrorResponse } from '../models/error-response.model';
import {} from 'reflect-metadata';

export type ModelType<T extends JsonApiModel> = { new(datastore: JsonApiDatastore, data: any): T; };

type RequestOptions = {
  headers: HttpHeaders,
  observe: 'response',
  responseType: 'json',
}

@Injectable()
export class JsonApiDatastore {
  private _headers: HttpHeaders;
  private _store: any = {};

  constructor(private http: HttpClient) { }

  query<T extends JsonApiModel>(modelType: ModelType<T>, params?: any, headers?: HttpHeaders): Observable<T[]> {
    let options: RequestOptions = this.getOptions(headers);
    let url: string = this.buildUrl(modelType, params);
    return this.http.get(url, options).pipe(
        map((res: HttpResponse<Object>) => this.extractQueryData(res, modelType)),
        catchError((res: HttpErrorResponse) => this.handleError(res)), );
  }

  findRecord<T extends JsonApiModel>(modelType: ModelType<T>, id: string, params?: any, headers?: HttpHeaders): Observable<T> {
    let options: RequestOptions = this.getOptions(headers);
    let url: string = this.buildUrl(modelType, params, id);
    return this.http.get(url, options).pipe(
        map((res: HttpResponse<Object>) => this.extractRecordData(res, modelType)),
        catchError((res: HttpErrorResponse) => this.handleError(res)), );
  }

  createRecord<T extends JsonApiModel>(modelType: ModelType<T>, data?: any): T {
    return new modelType(this, {attributes: data});
  }

  saveRecord<T extends JsonApiModel>(attributesMetadata: any, model?: T, params?: any, headers?: HttpHeaders): Observable<T> {
    let modelType = <ModelType<T>>model.constructor;
    let typeName: string = Reflect.getMetadata('JsonApiModelConfig', modelType).type;
    let options: RequestOptions = this.getOptions(headers);
    let relationships: any = this.getRelationships(model);
    let url: string = this.buildUrl(modelType, params, model.id);
    let dirtyData: any = {};
    for (let propertyName in attributesMetadata) {
      if (attributesMetadata.hasOwnProperty(propertyName)) {
        let metadata: any = attributesMetadata[propertyName];
        if (metadata.hasDirtyAttributes) {
          dirtyData[propertyName] = metadata.serialisationValue ? metadata.serialisationValue : metadata.newValue;
        }
      }
    }
    let httpCall: Observable<HttpResponse<Object>>;
    let body: any = {
      data: {
        type: typeName,
        id: model.id,
        attributes: dirtyData,
        relationships: relationships
      }
    };
    if (model.id) {
      httpCall = this.http.patch(url, body, options);
    } else {
      httpCall = this.http.post(url, body, options);
    }
    return httpCall.pipe(
        map((res: HttpResponse<Object>) => this.extractRecordData(res, modelType, model)),
        map((res: T) => this.resetMetadataAttributes(res, attributesMetadata, modelType)),
        map((res: T) => this.updateRelationships(res, relationships)),
        catchError((res: HttpErrorResponse) => this.handleError(res)), );
  }

  deleteRecord<T extends JsonApiModel>(modelType: ModelType<T>, id: string, headers?: HttpHeaders): Observable<void> {
    let options: RequestOptions = this.getOptions(headers);
    let url: string = this.buildUrl(modelType, null, id);
    return this.http.delete(url, options).pipe(
        map((res: HttpResponse<{}>) => {}),
        catchError((res: HttpErrorResponse) => this.handleError(res)));
  }

  peekRecord<T extends JsonApiModel>(modelType: ModelType<T>, id: string): T {
    let type: string = Reflect.getMetadata('JsonApiModelConfig', modelType).type;
    return this._store[type] ? this._store[type][id] : null;
  }

  peekAll<T extends JsonApiModel>(modelType: ModelType<T>): T[] {
    let type = Reflect.getMetadata('JsonApiModelConfig', modelType).type;
    return _.values(<JsonApiModel>this._store[type]);
  }

  set headers(headers: HttpHeaders) {
    this._headers = headers;
  }

  private buildUrl<T extends JsonApiModel>(modelType: ModelType<T>, params?: any, id?: string): string {
    let typeName: string = Reflect.getMetadata('JsonApiModelConfig', modelType).type;
    let baseUrl: string = Reflect.getMetadata('JsonApiDatastoreConfig', this.constructor).baseUrl;
    let idToken: string = id ? `/${id}` : null;
    return [baseUrl, typeName, idToken, (params ? '?' : ''), this.toQueryString(params)].join('');
  }

  private buildSingleRelationshipData(model: JsonApiModel): any {
    let relationshipType: string =  Reflect.getMetadata('JsonApiModelConfig', model.constructor).type;
    let relationShipData: {type: string, id?: string, attributes?: any} = {type: relationshipType};
    if (model.id) {
      relationShipData.id = model.id;
    } else {
      let dirtyData: any = {};
      let attributesMetadata: any = Reflect.getMetadata('Attribute', model);

      for (let propertyName in attributesMetadata) {
        if (attributesMetadata.hasOwnProperty(propertyName)) {
          let metadata: any = attributesMetadata[propertyName];
          if (metadata.hasDirtyAttributes) {
            dirtyData[propertyName] = metadata.newValue;
          }
        }
      }
      relationShipData.attributes = dirtyData;
    }
    return relationShipData;
  }

  private getRelationships(data: any): any {
    let relationships: any;
    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        if (data[key] instanceof JsonApiModel) {
          relationships = relationships || {};
          relationships[key] = {
            data: this.buildSingleRelationshipData(data[key])
          };
        } else if (data[key] instanceof Array) {
          relationships = relationships || {};
          let relationshipsData = data[key],
              modelRelationships = _.filter(relationshipsData, function(entry) {
                return entry instanceof JsonApiModel;
              });
          relationships[key] = {
            data: modelRelationships.map((model: JsonApiModel) => this.buildSingleRelationshipData(model))
          };
        }
      }
    }
    return relationships;
  }

  private extractQueryData<T extends JsonApiModel>(res: HttpResponse<Object>, modelType: ModelType<T>): T[] {
    let body: any = res.body;
    let models: T[] = [];
    body.data.forEach((data: any) => {
      let model: T = new modelType(this, data);
      this.addToStore(model);
      if (body.included) {
        model.syncRelationships(data, body.included, 0);
        this.addToStore(model);
      }
      models.push(model);
    });
    return models;
  }

  private extractRecordData<T extends JsonApiModel>(res: HttpResponse<Object>, modelType: ModelType<T> , model ?: T): T {
    let body: any = res.body;
    if (model) {
      model.id = body.data.id;
      _.extend(model, body.data.attributes);
    }
    model = model || new modelType(this, body.data);
    this.addToStore(model);
    if (body.included) {
      model.syncRelationships(body.data, body.included, 0);
      this.addToStore(model);
    }
    return model;
  }

  protected handleError<T>(error: HttpErrorResponse): Observable<T> {
    let errMsg: string = (error.message) ? error.message :
        error.status ? `${error.status} - ${error.statusText}` : 'Server error';
    try {
      let body: any = error.error;
      if (body.errors && body.errors instanceof Array) {
        let errors: ErrorResponse = new ErrorResponse(body.errors);
        console.error(errMsg, errors);
        return observableThrowError(errors);
      }
    } catch (e) {
      // no valid JSON
    }

    console.error(errMsg);
    return observableThrowError(errMsg);
  }

  private getOptions(customHeaders ?: HttpHeaders): RequestOptions {
    let headers = new HttpHeaders();
    headers = headers.set('Accept', 'application/vnd.api+json');
    headers = headers.set('Content-Type', 'application/vnd.api+json');

    if (this._headers) {
      this._headers.keys().forEach((key) => {
        headers = headers.set(key, this._headers.getAll(key));
      })
    }

    if (customHeaders) {
      customHeaders.keys().forEach((key) => {
        headers = headers.set(key, customHeaders.getAll(key));
      });
    }

    return {
      headers,
      observe: 'response',
      responseType: 'json',
    };
  }

  private toQueryString(params: any) {
    let encodedStr = '';
    for (let key in params) {
      if (params.hasOwnProperty(key)) {
        if (encodedStr && encodedStr[encodedStr.length - 1] !== '&') {
          encodedStr = encodedStr + '&';
        }
        let value: any = params[key];
        if (value instanceof Array) {
          for (let i = 0; i < value.length; i++) {
            encodedStr = encodedStr + key + '=' + encodeURIComponent(value[i]) + '&';
          }
        } else if (typeof value === 'object') {
          for (let innerKey in value) {
            if (value.hasOwnProperty(innerKey)) {
              encodedStr = encodedStr + key + '[' + innerKey + ']=' + encodeURIComponent(value[innerKey]) + '&';
            }
          }
        } else {
          encodedStr = encodedStr + key + '=' + encodeURIComponent(value);
        }
      }
    }
    if (encodedStr[encodedStr.length - 1] === '&') {
      encodedStr = encodedStr.substr(0, encodedStr.length - 1);
    }
    return encodedStr;
  }

  public addToStore(models: JsonApiModel | JsonApiModel[]): void {
    let model: JsonApiModel = models instanceof Array ? models[0] : models;
    let type: string = Reflect.getMetadata('JsonApiModelConfig', model.constructor).type;
    if (!this._store[type]) {
      this._store[type] = {};
    }
    let hash: any = this.fromArrayToHash(models);
    _.extend(this._store[type], hash);
  }

  private fromArrayToHash(models: JsonApiModel | JsonApiModel[]): any {
    let modelsArray: JsonApiModel[] = models instanceof Array ? models : [models];
    return _.keyBy(modelsArray, 'id');
  }

  private resetMetadataAttributes < T extends JsonApiModel > (res: T, attributesMetadata: any, modelType: ModelType<T>): T {
    attributesMetadata = Reflect.getMetadata('Attribute', res);
    for (let propertyName in attributesMetadata) {
      if (attributesMetadata.hasOwnProperty(propertyName)) {
        let metadata: any = attributesMetadata[propertyName];
        if (metadata.hasDirtyAttributes) {
          metadata.hasDirtyAttributes = false;
        }
      }
    }
    Reflect.defineMetadata('Attribute', attributesMetadata, res);
    return res;
  }

  private updateRelationships < T extends JsonApiModel > (model: T, relationships: any): T {
    let modelsTypes: any = Reflect.getMetadata('JsonApiDatastoreConfig', this.constructor).models;
    for (let relationship in relationships) {
      if (relationships.hasOwnProperty(relationship) && model.hasOwnProperty(relationship)) {
        let relationshipModel: JsonApiModel = model[relationship];
        let hasMany: any[] = Reflect.getMetadata('HasMany', relationshipModel);
        let propertyHasMany: any = _.find(hasMany, (property) => {
          return modelsTypes[property.relationship] === model.constructor;
        });
        if (propertyHasMany && relationshipModel[propertyHasMany.propertyName]) {
          relationshipModel[propertyHasMany.propertyName].push(model);
        }
      }
    }
    return model;
  };
}
