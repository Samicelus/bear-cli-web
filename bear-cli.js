
class ajax{
    constructor(){
        if(window.XMLHttpRequest){
            this._xhr = new XMLHttpRequest();
        }else{
            this._xhr = new ActiveXObject('Microsoft.XMLHTTP');
        }
    }

    async get(data, url, headers){
        let that = this;
        return new Promise(function(resolve, reject){
            let params = [];
            for(let key in data){
                params.push(key + "=" + data[key]);
            }
            let query = params.join("&");
            if(url.indexOf("?") != -1){
                //有参数，不加"?"
                url += query;
            }else if(query){
                url += "?" + query;
            }
            that._xhr.open("GET", url, true);
            if(headers){
                for(let header_key in headers){
                    that._xhr.setRequestHeader(header_key, headers[header_key]);
                }
            }
            that._xhr.send();
            that._xhr.onreadystatechange = function () {
                if (that._xhr.readyState == 4){
                    if(that._xhr.status == 200) {
                        try{
                            let response;
                            try{
                                response = JSON.parse(that._xhr.responseText);
                            }catch(e){
                                response = that._xhr.responseText
                            }
                            resolve(response);
                        }catch(e){
                            reject(e);
                        }
                    }else{
                        reject(new Error(that._xhr.statusText));
                    }
                }
            }
        })
    }

    async post(data, url, headers){
        let that = this;
        return new Promise(function(resolve, reject){
            let params = [];
            for(let key in data){
                params.push(key + "=" + data[key]);
            }
            let postdata = params.join("&");
            that._xhr.open("POST", url, true);
            if(headers){
                for(let header_key in headers){
                    that._xhr.setRequestHeader(header_key, headers[header_key]);
                }
            }
            that._xhr.send(postdata);
            that._xhr.onreadystatechange = function () {
                if (that._xhr.readyState == 4){
                    if(that._xhr.status == 200) {
                        try{
                            let response;
                            try{
                                response = JSON.parse(that._xhr.responseText);
                            }catch(e){
                                response = that._xhr.responseText
                            }
                            resolve(response);
                        }catch(e){
                            reject(e);
                        }
                    }else{
                        reject(new Error(that._xhr.statusText));
                    }
                }
            }
        })
    }

}


class bear_cli{
    constructor(remoteIP, remotePort, app_id){
        this._ajax = new ajax();
        //socket.io 默认连接的path是/socket.io
        this._host = remoteIP;
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
        this._out_id = "";
        this._user_id = "";
        this._token = "";
        this._app_id = app_id;
        this._handlers = {};
        this._jwt = "";
        this._expire = 0;
    }

    reset_expire(){
        this._expire = 0;
    }

    async set_jwt(jwt){
        this._jwt = jwt;
        return true;
    }

    async set_out_id(out_id){
        this._out_id = out_id;
        return true;
    }

    get_jwt(){
        return this._jwt;
    }

    get_user_id(){
        return this._user_id;
    }

    async set_user_id(user_id){
        this._user_id = user_id;
        return true;
    }

    async set_token(token, expire){
        this._token = token;
        this._expire = expire - 60000;
        return true;
    }

    async relog(){
        let that = this;
        let url = "http://" + this._host;
        if(this._jwt){
            let jwt = this._jwt;
            return this._ajax.post({},url+"/12133/reloginUser",{"x-json-web-token":jwt}).then((data_received)=>{
                console.log("relog_ret:",data_received);
                that._expire = data_received.data.expire_timestamp;
                return true;
            }).catch((e)=>{
                throw e;
            })
        }else if(this._out_id){
            let that = this;
            let out_id = this._out_id;
            return this._ajax.post({out_id:out_id},url+"/12133/reloginOutside").then((data_received)=>{
                console.log("relog_ret:",data_received);
                that._expire = data_received.data.expire_timestamp;
                return true;
            }).catch((e)=>{
                throw e;
            })
        }else{
            throw new Error(`no loggin params set!`);
        }
    }

    async login(){
        let that = this;
        let url = "http://" + this._host;
        if(this._jwt){
            let jwt = this._jwt;
            return this._ajax.post({},url+"/12133/loginUser",{"x-json-web-token": jwt}).then((data_received)=>{
                console.log("log_ret:",data_received);
                that._user_id = data_received.data.user_id;
                that._token = data_received.data.token;
                that._expire = data_received.data.expire_timestamp;
                let route = "user.user_handler.login";
                return that.request(route, {});
            }).catch((e)=>{
                throw e;
            });
        }else if(this._out_id){
            let that = this;
            let out_id = this._out_id;
            return this._ajax.post({out_id:out_id},url+"/12133/loginOutside").then((data_received)=>{
                console.log("relog_ret:",data_received);
                that._user_id = data_received.data.user_id;
                that._token = data_received.data.token;
                that._expire = data_received.data.expire_timestamp;
                let route = "user.user_handler.login";
                return that.request(route, {});
            }).catch((e)=>{
                throw e;
            })
        }else{
            throw new Error(`no loggin params set!`);
        }
    }

    set_handlers(handlers){
        this._handlers = handlers;
        console.log(`handler set`);
    }

    async request(route, data){
        let that = this;
        let nowtimestamp = new Date().getTime();
        if(this._expire < nowtimestamp){
            return this.relog().then((ret)=>{
                if(ret){
                    console.log(`request:${route}`);
                    let server_type = route.split('.')[0];
                    console.log(`server_type:${server_type}`);
                    let target_socket = server_type == "user"?that._socket:that._app_socket[server_type];
                    let handler_name = route.split('.')[1];
                    let method = route.split('.')[2];
                    data.user_id = that._user_id;
                    data.app_id = that._app_id;
                    data.token = that._token;
                    data.handler_name = handler_name;
                    data.method = method;
                    return Promise.resolve(target_socket.send(data));
                }
            }).catch((e)=>{
                throw e;
            })
        }else{
            console.log(`request:${route}`);
            let server_type = route.split('.')[0];
            console.log(`server_type:${server_type}`);
            let target_socket = server_type == "user"?this._socket:this._app_socket[server_type];
            let handler_name = route.split('.')[1];
            let method = route.split('.')[2];
            data.user_id = this._user_id;
            data.app_id = this._app_id;
            data.token = this._token;
            data.handler_name = handler_name;
            data.method = method;
            return Promise.resolve(target_socket.send(data));
        }
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

function generateSign(data, secret){
    let sign = '';
    let params = data;
    delete params['sign'];
    let sortObj = sortByAscii(params);
    let p_str = '';
    for(let k in sortObj){
        p_str += k + '=' + sortObj[k];
    }
    let signature = utils.sha1((p_str + 'sdfklkjk23jjkdfas'));
    return signature;
}

function sortByAscii(obj){
    var param_keys = [];
    for(var i in obj){
        param_keys.push(i);
    }
    //递归比较单词字母顺序
    function compare(w0, w1, i){
        if(w0.charCodeAt(i) === w1.charCodeAt(i)){
            return compare(w0, w1, ++i);
        }else if(isNaN(w0.charCodeAt(i)) && !isNaN(w1.charCodeAt(i))){
            return 0 - w1.charCodeAt(i);
        }else if(!isNaN(w0.charCodeAt(i)) && isNaN(w1.charCodeAt(i))){
            return w0.charCodeAt(i) - 0;
        }else{
            return w0.charCodeAt(i) - w1.charCodeAt(i);
        }
    }
    //排序后的键
    var new_param_keys = param_keys.sort(function(a, b){
        return compare(a, b, 0);
    });
    var new_obj = {};
    for(var i in new_param_keys){
        for(var j in obj){
            if(obj[j] != null && obj[j] !== '' && new_param_keys[i] == j){   //参数的值为空不参与签名,如果signNull为true则参与
                // log(new_param_keys[i] + '\t' + j + '\t' + package[j]);
                new_obj[j] = obj[j];
            }
        }
    }
    return new_obj;
}

module.exports = bear_cli;