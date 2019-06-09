declare namespace Posterus {
  export class Future<T = any> {
    map: <U>(mapper: (error?: any, result?: T) => any) => Future<U>;
    mapResult: <U>(mapper: (result: T) => any) => Future<U>;
    mapError: <U>(mapper: (error: any) => any) => Future<U>;
    finally: <U>(mapper: (error?: any, result?: any) => any) => Future<U>;
    deinit: () => void;
    weak: () => Future<T>;
    settle: (error?: any, result?: any) => void;
    toPromise: () => Promise<T>;
    then: Promise<T>['then'];
    catch: Promise<T>['catch'];
    finishPending: () => void;
    deref: () => T | undefined;
  }

  interface FutureConstructor {
    readonly prototype: Future<any>;
    new <T>(): Future<T>;
    from: (...args: any[]) => Future<any>;
    fromResult: <U>(result: U) => Future<U>;
    fromError: <U>(error: any) => Future<U>;
    fromPromise: <U>(promise: Promise<U>) => Future<U>;
    all: (values: any[]) => Future<any>;
    race: (values: any[]) => Future<any>;
  }
}

declare module 'posterus' {
  export type Future<T = any> = Posterus.Future<T>;
  export const Future: Posterus.FutureConstructor;
  export const isFuture: (value: any) => boolean;
  export const isDeinitError: (error: any) => boolean;
}

declare module 'posterus/fiber' {
  // Keep an eye on https://github.com/Microsoft/TypeScript/pull/30790
  //  would like to remove the <any> and infer from iterator's explicit return type
  export const fiber: <T>(iterator: IterableIterator<any>) => Posterus.Future<T>;
}
