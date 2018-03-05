class bear_cli{
    constructor(login_url, remoteIP, remotePort){
        this._login_url = login_url;
        //socket.io 默认连接的path是/socket.io
        console.log(`login server:http://${remoteIP}`,{path:`/${remotePort}/socket.io`});
        let socket = io(`http://${remoteIP}`,{path:`/${remotePort}/socket.io`});
        this._socket = socket;
        let that = this;
        this._socket.on('message', function (data) {
            console.log(`\n[user socket] recieve data:`,data);
                let handler_name = `${data.handler_name}_handler`;
                if(that._handlers&&that._handlers[handler_name]){
                    that._handlers[handler_name](data);
                }
        });
        this._app_socket = {};
        this._user_id = "";
        this._token = "";
        this._battle = {};
        this._handlers = {};
        this._jwt = "";
    }

    set_jwt(jwt){
        this._jwt = jwt;
    }

    get_jwt(){
        return this._jwt;
    }

    get_user_id(){
        return this._user_id;
    }

    set_user_id(user_id){
        this._user_id = user_id;
    }

    set_token(token){
        this._token = token;
    }

    login(jwt){
        let that = this;
        $.ajax(
            {
                url: this._login_url,
                headers:{
                    "x-json-web-token":jwt
                },
                type:"post",
                data:{},
                success: (data_received, status)=>{
                    console.log("data_received:",data_received);
                    that._user_id = data_received.data.user_id;
                    that._token = data_received.data.token;
                    let route = "user.user_handler.login";
                    that.request(route, {});
                }
            }
        );
    }

    set_handlers(handlers){
        this._handlers = handlers;
        console.log(`handler set`);
    }

    request(route, data){
        console.log(`request:${route}`);
        let server_type = route.split('.')[0];
        console.log(`server_type:${server_type}`);
        let target_socket = server_type == "user"?this._socket:this._app_socket[server_type];
        let handler_name = route.split('.')[1];
        let method = route.split('.')[2];
        data.user_id = this._user_id;
        data.token = this._token;
        data.handler_name = handler_name;
        data.method = method;
        return Promise.resolve(target_socket.send(data));
    }

    set_app_socket(server_type, host, port){
        this._app_socket[server_type] = io(`http://${host}`,{path:`/${port}/socket.io`});
        if(server_type == "chat"){
            let join_route = "chat.chat_handler.joinCurrentRoom";
            this.request(join_route, {});
        }
        let that = this;
        this._app_socket[server_type].on('message', function (data) {
            console.log(`\n[${server_type} socket] recieve data:`,data);
            let handler_name = `${data.handler_name}_handler`;
            if(that._handlers&&that._handlers[handler_name]){
                that._handlers[handler_name](data);
            }
        })
    }
}

module.exports = bear_cli;