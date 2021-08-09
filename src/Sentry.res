type event = {
    id: string,
    timestamp: Js.Date.t,
    message: option<string>,
}


let e = {
    id: "ok",
    timestamp: Js.Date.make(),
    message: None,
}

Js.log(e)
