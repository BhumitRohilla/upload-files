import { NextResponse } from "next/server";

export class CustomError extends Error{
    private statusCode 
    private frontendMessage

    constructor(code: number, message: string, frontEndMessage?: string){
        super(message)
        this.statusCode = code;
        this.frontendMessage = frontEndMessage ?? 'Internal Server Error'
    }

    get statuscode() {
        return this.statusCode
    }

    get messageFrontend() {
        return this.frontendMessage
    }

    constructResponse() {
        return NextResponse.json({ error: this.frontendMessage }, { status: this.statusCode })
    }
}