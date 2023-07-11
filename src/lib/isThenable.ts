export interface Thenable {
    then: Function;
    catch: Function;
}

function hasThen(input: { then?: Function }): boolean {
    return Reflect.has(input, 'then') && typeof input.then === 'function';
}

function hasCatch(input: { catch?: Function }): boolean {
    return Reflect.has(input, 'catch') && typeof input.catch === 'function';
}

export function isThenable(input: unknown): input is Thenable {
    if (typeof input !== 'object' || input === null) return false;
    return (
        input instanceof Promise ||
        (input !== Promise.prototype && hasThen(input) && hasCatch(input))
    );
}