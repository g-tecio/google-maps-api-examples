function objectToJSON(obj) {
    let result = JSON.stringify(obj);
    result = JSON.parse(result);
    return result;
};