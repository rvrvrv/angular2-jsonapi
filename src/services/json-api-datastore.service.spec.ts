import {TestBed} from '@angular/core/testing';
import { Author } from '../../test/models/author.model';
import {
    AUTHOR_ID, AUTHOR_NAME, AUTHOR_BIRTH,
    getAuthorData
} from '../../test/fixtures/author.fixture';
import {
  HttpRequest, HttpHeaders
} from '@angular/common/http';
import { HttpTestingController, HttpClientTestingModule } from '@angular/common/http/testing';
import {MockBackend, MockConnection} from '@angular/http/testing';
import {Datastore, BASE_URL} from '../../test/datastore.service';
import { ErrorResponse } from '../models/error-response.model';
import * as moment from 'moment';
import {} from 'jasmine';

const RequestMethod = {
  Get: 'GET',
};

describe('JsonApiDatastore', () => {
  let datastore: Datastore;
  let http: HttpTestingController;

    beforeEach(() => {

        TestBed.configureTestingModule({
            imports: [
              HttpClientTestingModule,
            ],
            providers: [
                Datastore
            ]
        });

        datastore = TestBed.get(Datastore);
        http = TestBed.get(HttpTestingController);
    });


    describe('query', () => {

        it('should build basic url', () => {
          datastore.query(Author).subscribe();

          const testRequest = http.expectOne(BASE_URL + 'authors');
          expect(testRequest.request.method).toEqual(RequestMethod.Get);
          testRequest.flush({data: []});
        });

        it('should set JSON API headers', () => {
          datastore.query(Author).subscribe();

          const testRequest = http.expectOne(BASE_URL + 'authors');
          expect(testRequest.request.method).toEqual(RequestMethod.Get);
          expect(testRequest.request.headers.get('Content-Type')).toEqual('application/vnd.api+json');
          expect(testRequest.request.headers.get('Accept')).toEqual('application/vnd.api+json');
          testRequest.flush({data: []});
        });

        it('should build url with params', () => {
          datastore.query(Author, {
              page: { size: 10, number: 1},
              include: 'comments'
          }).subscribe();

          const testRequest = http.expectOne(BASE_URL + 'authors?page[size]=10&page[number]=1&include=comments');
          expect(testRequest.request.method).toEqual(RequestMethod.Get);
          expect(testRequest.request.headers.get('Content-Type')).toEqual('application/vnd.api+json');
          expect(testRequest.request.headers.get('Accept')).toEqual('application/vnd.api+json');
          testRequest.flush({data: []});
        });

        it('should have custom headers', () => {
          datastore.query(Author, null, new HttpHeaders().set('Authorization', 'Bearer'))
              .subscribe();

          const testRequest = http.expectOne(BASE_URL + 'authors');
          expect(testRequest.request.method).toEqual(RequestMethod.Get);
          expect(testRequest.request.headers.get('Authorization')).toEqual('Bearer');
          testRequest.flush({data: []});
        });

        it('should override base headers', () => {
            datastore.headers = new HttpHeaders().set('Authorization', 'Bearer');
            datastore.query(Author, null, new HttpHeaders().set('Authorization', 'Basic'))
                .subscribe();

            const testRequest = http.expectOne(BASE_URL + 'authors');
            expect(testRequest.request.method).toEqual(RequestMethod.Get);
            expect(testRequest.request.headers.get('Authorization')).toEqual('Basic');
            testRequest.flush({data: []});
        });

        it('should get authors', () => {
            datastore.query(Author).subscribe((authors) => {
              expect(authors).toBeDefined();
              expect(authors.length).toEqual(1);
              expect(authors[0].id).toEqual(AUTHOR_ID);
              expect(authors[0].name).toEqual(AUTHOR_NAME);
              expect(authors[1]).toBeUndefined();
            });

            const testRequest = http.expectOne(BASE_URL + 'authors');
            expect(testRequest.request.method).toEqual(RequestMethod.Get);
            testRequest.flush({
              data: [getAuthorData()]
            });
        });

        it('should fire error', () => {
            let resp = {
              errors: [
                {
                  code: '100',
                  title: 'Example error',
                  detail: 'detailed error Message'
                }
              ]
            };
            datastore.query(Author).subscribe((authors) => fail('onNext has been called'),
              (response) => {
                expect(response).toEqual(jasmine.any(ErrorResponse));
                expect(response.errors.length).toEqual(1);
                expect(response.errors[0].code).toEqual(resp.errors[0].code);
                expect(response.errors[0].title).toEqual(resp.errors[0].title);
                expect(response.errors[0].detail).toEqual(resp.errors[0].detail);
              },
              () => fail('onCompleted has been called'));

            const testRequest = http.expectOne(BASE_URL + 'authors');
            expect(testRequest.request.method).toEqual(RequestMethod.Get);
            testRequest.flush(resp, { statusText: 'Request Error', status: 500});
        });
    });

    describe('findRecord', () => {
        it('should get author', () => {
          datastore.findRecord(Author, '1').subscribe((author) => {
            expect(author).toBeDefined();
            expect(author.id).toBe(AUTHOR_ID);
            expect(author.date_of_birth).toEqual(moment(AUTHOR_BIRTH, 'YYYY-MM-DD').toDate());
          });
          const testRequest = http.expectOne(BASE_URL + 'authors/1');
          expect(testRequest.request.method).toEqual(RequestMethod.Get);
          testRequest.flush({
            data: getAuthorData()
          });
        });
    });
});
