/**
 * Converts Regular Expressions To Machine Readable REGEX
 * example :
 *   input : a(b+a+λ)+b(a+b(a+b))
 *   output : a(b|a)?|b(a|b(a|b))
 */
class MachineReadableRegexConverter {
    constructor() {
        this.LAMBDA = 'λ';
    }

    convert(regex) {
        const parsedRegex = this.parseRegex(regex);
        const lambdaCharsConverted = this.convertLambda(parsedRegex, '+');
        const orSeparatorsConverted = this.convertOrSeparator(lambdaCharsConverted);
        return this.stringifyRegex(orSeparatorsConverted);
    }

    /**
     * Parses Regular Expression to Array based on parentheses
     * example :
     *   input : a(a+b)+b+a
     *   output : ['a', ['a+b'], '+b+a']
     * @param {string} regex
     * @return {[]}
     */
    parseRegex(regex) {
        const result = [];
        let i = 0;
        let temp = '';

        while (i < regex.length) {
            const chr = regex[i];

            switch (chr) {
                // if arrived to open parenthesis
                case '(':
                    // if temp var is not empty, push it to result
                    if (temp.length) {
                        result.push(temp);
                        temp = '';
                    }

                    // process parenthesis content recursively
                    const closeParIndex = this.getCloseParIndex(regex, i);
                    const res = this.parseRegex(regex.slice(i + 1, closeParIndex));
                    result.push(res);

                    // and take i variable to the end of the open parenthesis
                    i = closeParIndex;
                    break;

                // hold all characters except parentheses in temp variable
                default:
                    temp += chr;
                    break;
            }

            i++;
        }

        if (temp.length) {
            result.push(temp);
        }

        return result;
    }

    /**
     * This function looks for an open parenthesis and returns index of close pair of it
     * Search starts from i variable , default is 0
     *
     * example with i = 0 :
     *   input : a(a+b)+(a+b)
     *   output : 5
     *
     * example with i = 5
     *   input : a(a+b)+(a+b)
     *   output : 11
     *
     * @param {string} regex
     * @param {number} i
     * @return {number}
     */
    getCloseParIndex(regex, i = 0) {
        let parCounter = 0;

        for (; i < regex.length; i++) {
            if (regex[i] === '(') {
                parCounter++;
            } else if (regex[i] === ')') {
                parCounter--;

                if (parCounter === 0) return i;
            }
        }

        return -1;
    }

    /**
     * Converts + or separator to |
     * @param regex
     */
    convertOrSeparator(regex) {
        for (let i = 0; i < regex.length; i++) {
            let group = regex[i];

            if (Array.isArray(group)) {
                regex[i] = this.convertOrSeparator(group);
            } else if (typeof group === 'string') {
                regex[i] = group.replace(/\+/g, '|');
            }
        }

        return regex;
    }

    /**
     * Converts lambda character to question mark
     * @param regex
     * @param {string} orSeparator accepts '+' or '|'
     */
    convertLambda(regex, orSeparator = '+') {
        let hasLambda = false;

        for (let i = 0; i < regex.length; i++) {
            let group = regex[i];

            if (Array.isArray(group)) {
                // process subGroup recursively
                const subGroup = this.convertLambda(group);

                // if group was something like this : [['a+b'], '?']
                // replace this group with ['a+b'] and put '?' in next index
                // this action makes the result flatter and prettier
                const lastItemOfSubGroup = subGroup[subGroup.length - 1];
                if (subGroup.length === 2 && lastItemOfSubGroup === '?') {
                    // if next item is not exists, that means current is the last item
                    if (regex[i + 1] === undefined) {
                        // so push '?' to the regex
                        regex.push('?');
                    }
                    // if next item is an array, so insert '?' after current item
                    else if (Array.isArray(regex[i + 1])) {
                        // this code inserts an item before index of i + 1
                        regex.splice(i + 1, 0, '?');
                    }
                    // if next item is string, prepend '?' to the next item
                    else if (typeof regex[i + 1] === 'string') {
                        regex[i + 1] = '?' + regex[i + 1];
                    }
                }
            } else if (typeof group === 'string') {
                group = group.split(orSeparator);

                // if group have lambda character
                if (group.includes(this.LAMBDA)) {
                    // enable hasLambda to add '?' character to the end of group
                    hasLambda = true;
                    // remove lambda character
                    group = group.filter(g => g !== this.LAMBDA);
                    regex[i] = group.join(orSeparator);
                }
            }
        }

        if (hasLambda) return [regex, '?'];

        return regex;
    }

    /**
     * Converts this.parseRegex output to the string
     * example :
     *   input : ['a', ['a|b']]
     *   output : 'a(a|b)'
     * @param regex
     * @return {string}
     */
    stringifyRegex(regex) {
        let result = '';

        for (let group of regex) {
            if (Array.isArray(group)) {
                result += '(' + this.stringifyRegex(group) + ')';
            } else if (typeof group === 'string') {
                result += group;
            }
        }

        return result;
    }
}
