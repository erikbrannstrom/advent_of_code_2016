const fs = require("fs");

const regexInitValue = /value (\d+) goes to bot (\d+)/;
const regexGiveValue = /bot (\d+) gives low to (output|bot) (\d+) and high to (output|bot) (\d+)/;

const give = (state, from, lowTo, highTo) => {
    const values = state[from];
    const low = values[0] < values[1] ? values[0] : values[1];
    const high = values[0] < values[1] ? values[1] : values[0];

    return Object.assign({}, state, {
        [from]: [],
        [lowTo]: state[lowTo] ? state[lowTo].concat(low) : [low],
        [highTo]: state[highTo] ? state[highTo].concat(high) : [high],
    });
}

const getInitialBotState = (instructions) => {
    return instructions.filter(instruction => regexInitValue.test(instruction)).reduce((state, instruction) => {
        let matches = instruction.match(regexInitValue);
        const bot = `bot${ matches[2] }`;
        const value = parseInt(matches[1], 10);
        if (!state[bot]) {
            return Object.assign(state, { [bot]: [value] });
        }
        return Object.assign(state, { [bot]: state[bot].concat(value) });
    }, {});
};

const getBotCompareFunctions = (instructions) => {
    const getCompareFunction = (from, lowTo, highTo) => (state) => give(state, from, lowTo, highTo);
    return instructions.filter(instruction => regexGiveValue.test(instruction)).reduce((state, instruction) => {
        let matches = instruction.match(regexGiveValue);
        const bot = `bot${ matches[1] }`;
        const lowTo = `${ matches[2] }${ matches[3] }`;
        const highTo = `${ matches[4] }${ matches[5] }`;
        return Object.assign(state, { [bot]: getCompareFunction(bot, lowTo, highTo) });
    }, {});
};

const applyCompareFunction = (state, botCompareFunctions) => {
    const bot = Object.keys(state).filter(key => key.startsWith("bot")).find(id => state[id].length === 2);
    if (!bot) {
        return state;
    }
    return botCompareFunctions[bot](state);
};

const getAllStates = (initialState, botCompareFunctions) => {
    let states = [initialState];

    while (true) {
        const currentState = states[states.length - 1];
        const nextState = applyCompareFunction(currentState, botCompareFunctions);
        if (currentState === nextState) {
            return states;
        }

        states = states.concat(nextState);
    }
};

const containsSameValues = (array1, array2) => {
    if (array1.length !== array2.length) {
        return false;
    }

    const sorted1 = [].concat(array1).sort();
    const sorted2 = [].concat(array2).sort();
    return sorted1.every((val, index) => val === sorted2[index]);
}

const findBotComparingValues = (initialState, botCompareFunctions, values) => {
    const allStates = getAllStates(initialState, botCompareFunctions);
    const getBotComparingValues = (state) => Object.keys(state).filter(key => key.startsWith("bot")).find(bot => containsSameValues(state[bot], values));
    return getBotComparingValues(allStates.find(getBotComparingValues));
};

const instructions = fs.readFileSync(process.argv[2], "utf8").split("\n").filter(line => line !== "");
const initialBotState = getInitialBotState(instructions);
const botCompareFunctions = getBotCompareFunctions(instructions);

// Part 1
console.log(findBotComparingValues(initialBotState, botCompareFunctions, [17, 61]));

// Part 2
const allStates = getAllStates(initialBotState, botCompareFunctions);
const finalState = allStates[allStates.length - 1];
console.log(Object.keys(finalState).filter(key => key.startsWith("output")).reduce((outputs, key) => Object.assign(outputs, { [key]: finalState[key] }), {}));
