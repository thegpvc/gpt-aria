export type ContinueCommand = {
    index: number // index usually of combobox search field
    params: string[] // params indicate text to put into box
}

export type Summary = {
    result: string;
}

export type NextState = ContinueCommand | Summary
