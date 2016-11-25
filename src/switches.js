// @flow

const switches = {};

export function isActive(switchName: string) : bool {
    return switches.hasOwnProperty(switchName) && switches[switchName] === true;
}

export function setActive(switchName: string, active: bool) : void {
    switches[switchName] = active;
}

export const DUAL_BACKEND = 'DUAL_BACKEND';
