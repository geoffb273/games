export type FragmentData<T> = Omit<T, '__typename' | ' $fragmentRefs' | ' $fragmentName'>;
