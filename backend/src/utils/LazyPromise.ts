/**
 * A promise that defers execution of its factory until `.then()`, `.catch()`,
 * `.finally()`, or `await` is called. Useful for building queries or operations
 * that should only run when the result is actually consumed.
 */
export class LazyPromise<T> implements PromiseLike<T> {
  private factory: () => Promise<T>;
  private instance: Promise<T> | null = null;

  constructor(factory: () => Promise<T>) {
    this.factory = factory;
  }

  private resolve(): Promise<T> {
    if (!this.instance) {
      this.instance = this.factory();
    }
    return this.instance;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.resolve().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: unknown) => TResult | PromiseLike<TResult>) | null,
  ): Promise<T | TResult> {
    return this.resolve().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<T> {
    return this.resolve().finally(onfinally);
  }
}

export function lazy<T>(factory: () => Promise<T>): LazyPromise<T> {
  return new LazyPromise(factory);
}
