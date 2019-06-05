
declare namespace Posterus {
  export class Future {
    static from: (...args: any[]) => Future;
    static fromResult: (...args: any[]) => Future;
    static all: (...args: any[]) => Future;
    static race: (...args: any[]) => Future;
    map: (...args: any[]) => any;
    mapResult: (...args: any[]) => any;
    mapError: (...args: any[]) => any;
    finally: (...args: any[]) => any;
    deinit: (...args: any[]) => any;
  }
}

declare module 'posterus' {
  export const Future: Posterus.Future;
}

declare module 'posterus/fiber' {
  export const fiber: (...args: any[]) => Posterus.Future;
}
