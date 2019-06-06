declare namespace Posterus {
  export class Future<T = any> {
    map: (mapper: (error: any, result: any) => any) => Future;
    mapResult: (mapper: (result: any) => any) => Future;
    mapError: (mapper: (error: any) => any) => Future;
    finally: (mapper: (error: any, result: any) => any) => Future;
    deinit: () => void;
    weak: () => Future<T>;
    settle: (error: any, result: any) => void;
    toPromise: () => Promise<T>;
    then: Promise<T>['then'];
    catch: Promise<T>['catch'];
    finishPending: (...args: any[]) => any;
    deref: () => T | undefined;
  }

  interface FutureConstructor {
    readonly prototype: Future<any>;
    new <T>(): Future<T>;
    from: (...args: any[]) => Future;
    fromResult: (result?: any) => Future;
    fromPromise: (promise: Promise<any>) => Future<any>;
    all: (values: any[]) => Future;
    race: (values: any[]) => Future;
  }
}

declare module 'posterus' {
  export const Future: Posterus.FutureConstructor;
}

declare module 'posterus/fiber' {
  export const fiber: (...args: any[]) => Posterus.Future;
}
