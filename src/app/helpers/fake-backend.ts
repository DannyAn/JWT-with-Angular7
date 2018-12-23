import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpResponse,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HTTP_INTERCEPTORS
} from '@angular/common/http';
import {
    Observable,
    of,
    throwError
} from 'rxjs';
import {
    delay,
    mergeMap,
    materialize,
    dematerialize,
    filter
} from 'rxjs/operators';

@Injectable()
export class FakeAPIInterceptor implements HttpInterceptor {

    constructor() { }

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        //let dummyUser = { id: 1, username: 'JWT', password: 'JWT', firstName: 'JWT With', lastName: 'ANGULAR7' };
        let dummyUsers = [{ id: 1, username: 'JWT', password: 'JWT', firstName: 'JWT With', lastName: 'ANGULAR7' },
        { id: 2, username: 'admin', password: 'admin', firstName: 'admin With', lastName: 'ANGULAR7' }];
        // wrap in delayed observable to simulate server api call
        return of(null).pipe(mergeMap(() => {

            // authenticate
            if (request.url.endsWith('/users/authenticate') && request.method === 'POST') {
                let validUsers = dummyUsers.filter(userItem => (request.body.username === userItem.username && request.body.password === userItem.password));
                //if (request.body.username === dummyUser.username && request.body.password === dummyUser.password) {
                if (validUsers && validUsers.length > 0) {
                    // if login details are valid return 200 OK with a fake jwt token
                    let dummyUser = validUsers[0];
                    let body = {
                        id: dummyUser.id,
                        username: dummyUser.username,
                        firstName: dummyUser.firstName,
                        lastName: dummyUser.lastName,
                        token: 'fake-jwt-token'
                    };
                    return of(new HttpResponse({ status: 200, body }));
                } else {
                    // else return 400 bad request
                    return throwError({ error: { message: 'Username or password is incorrect' } });
                }
            }

            // get users
            if (request.url.endsWith('/users') && request.method === 'GET') {
                // check for fake auth token in header and return users if valid, this security is implemented server side in a real application
                if (request.headers.get('Authorization') === 'Bearer fake-jwt-token') {
                    //return of(new HttpResponse({ status: 200, body: [dummyUser] }));
                    return of(new HttpResponse({ status: 200, body: dummyUsers }));
                } else {
                    // return 401 not authorised if token is null or invalid
                    return throwError({ error: { message: 'Unauthorised' } });
                }
            }

            // pass through any requests not handled above
            return next.handle(request);

        }))

            // call materialize and dematerialize to ensure delay even if an error is thrown (https://github.com/Reactive-Extensions/RxJS/issues/648)
            .pipe(materialize())
            .pipe(delay(500))
            .pipe(dematerialize());
    }
}

export let FakeAPIProvider = {
    // use fake backend in place of Http service for backend-less development
    provide: HTTP_INTERCEPTORS,
    useClass: FakeAPIInterceptor,
    multi: true
};