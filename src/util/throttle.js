// @flow

import lo from 'lodash';

export function throttle(fn: any, timeout: number) {
    return lo.debounce(fn, timeout, {
        leading: true,
        trailing: true,
        maxWait: timeout
    });
}
