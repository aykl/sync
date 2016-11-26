// @flow

class AsyncQueue {
    _q: any;
    _lock: mixed;
    _tm: number;

    constructor() {
        this._q = [];
        this._lock = false;
        this._tm = 0;
    }

    next(): void {
        if (this._q.length > 0) {
            if (!this.lock())
                return;
            var item = this._q.shift();
            var fn = item[0], tm = item[1];
            this._tm = Date.now() + item[1];
            fn(this);
        }
    }

    lock(): bool {
        if (this._lock) {
            if (this._tm > 0 && Date.now() > this._tm) {
                this._tm = 0;
                return true;
            }
            return false;
        }

        this._lock = true;
        return true;
    }

    release(): bool {
        var self = this;
        if (!self._lock)
            return false;

        self._lock = false;
        setImmediate(function () {
            self.next();
        });
        return true;
    }

    queue(fn: any): void {
        var self = this;
        self._q.push([fn, 20000]);
        self.next();
    }

    reset(): void {
        this._q = [];
        this._lock = false;
    }
}

export default AsyncQueue;
