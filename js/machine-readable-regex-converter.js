/**
 * Converts Regular Expressions To Machine Readable REGEX
 * example :
 *   input : a(b+a+λ)+b(a+b(a+b))
 *   output : a(b|a)?|b(a|b(a|b))
 */
class MachineReadableRegexConverter{
    constructor() {
        this.LAMBDA = 'λ';
    }

    convert(regex){
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
    parseRegex(regex){
        const result = [];
        let i = 0;
        let temp = '';

        while(i < regex.length){
            const chr = regex[i];

            switch(chr){
                // if arrived to open parenthesis
                case '(':
                    // if temp var is not empty, push it to result
                    if(temp.length){
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
                default :
                    temp += chr;
                    break;
            }

            i ++;
        }

        if(temp.length){
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
    getCloseParIndex(regex, i = 0){
        let parCounter = 0;

        for(; i < regex.length; i ++){
            if(regex[i] === '('){
                parCounter ++;
            }else if(regex[i] === ')'){
                parCounter --;

                if(parCounter === 0) return i;
            }
        }

        return -1;
    }

    /**
     * Converts + or separator to |
     * @param regex
     */
    convertOrSeparator(regex){
        for(let i = 0; i < regex.length; i ++){
            let group = regex[i];

            if(Array.isArray(group)){
                regex[i] = this.convertOrSeparator(group);
            }else if(typeof group === 'string'){
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
    convertLambda(regex, orSeparator = '+'){
        let hasLambda = false;
        let prependToNext = null;

        for(let i = 0; i < regex.length; i++){
            let group = regex[i];

            // if prependToNext is enable
            if(prependToNext !== null){
                // if current item is array, so insert prependToNext string after current item
                if(Array.isArray(group)){
                    // this code inserts an item after index of i
                    regex.splice(i, 0, prependToNext);
                }
                // if current item is string, prepend prependToNext to the current item
                else if(typeof group === 'string'){
                    regex[i] = prependToNext + regex[i];
                }

                prependToNext = null;
            }

            if(Array.isArray(group)){
                // process subGroup recursively
                const subGroup = this.convertLambda(group);

                // if group was something like this : [['a+b'], '?']
                // replace this group with ['a+b'] and put '?' in next index
                const lastItemOfSubGroup = subGroup[subGroup.length - 1];
                if(subGroup.length === 2 && lastItemOfSubGroup === '?'){
                    prependToNext = '?';
                }
            }else if(typeof group === 'string'){
                group = group.split(orSeparator);

                // if group have lambda character
                if(group.includes(this.LAMBDA)){
                    // enable hasLambda to add '?' character to the end of group
                    hasLambda = true;
                    // remove lambda character
                    group = group.filter(g => g !== this.LAMBDA);
                    regex[i] = group.join(orSeparator);
                }
            }
        }

        if(prependToNext !== null) regex.push(prependToNext);

        if(hasLambda) return [regex, '?'];

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
    stringifyRegex(regex){
        let result = '';

        for(let group of regex){
            if(Array.isArray(group)){
                result += '(' + this.stringifyRegex(group) + ')';
            }else if(typeof group === 'string'){
                result += group;
            }
        }

        return result;
    }
}
