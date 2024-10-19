class ResponseDto {
    constructor(success, message, data) {
        this.success = success
        this.message = message
        this.data = data
    }
}

const ResponseUtil = {
    success: (message, data) => {
        return new ResponseDto(true, message, data)
    },
    failure: (message, data) => {
        return new ResponseDto(false, message, data)
    },
    error: (message, data) => {
        return new ResponseDto(false, message, data)
    }
}

module.exports = ResponseUtil