"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compactNumberAll = exports.compactNumber = exports.titleCase = void 0;
function titleCase(title) {
    return title[0].toUpperCase() + title.slice(1);
}
exports.titleCase = titleCase;
const formatter = Intl.NumberFormat("en", {
    notation: "compact",
    style: "currency",
    currency: "USD"
});
function compactNumber(number) {
    return formatter.format(number);
}
exports.compactNumber = compactNumber;
function compactNumberAll(number) {
    if (number < 1000) {
        return number.toString();
    }
    else if (number > 1000 && number < 1000000) {
        return (number / 1000).toFixed(1) + "k";
    }
    else if (number > 1000000 && number < 1000000000) {
        return (number / 1000000000).toFixed(1) + "m";
    }
    else if (number > 1000000000 && number < 1000000000000) {
        return (number / 1000000000000).toFixed(1) + "b";
    }
    else if (number > 1000000000000 && number < 1000000000000000) {
        return (number / 1000000000000000).toFixed(1) + "t";
    }
    return number.toString();
}
exports.compactNumberAll = compactNumberAll;
