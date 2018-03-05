class crypto{

    constructor(){
    }

    sha1(s) {
        return this.binb2hex(this.core_sha1(this.AlignSHA1(s)));
    }

    core_sha1(blockArray) {
        let x = blockArray; // append padding
        let w = Array(80);
        let a = 1732584193;
        let b = -271733879;
        let c = -1732584194;
        let d = 271733878;
        let e = -1009589776;
        for (let i = 0; i < x.length; i += 16) // 每次处理512位 16*32
        {
            let olda = a;
            let oldb = b;
            let oldc = c;
            let oldd = d;
            let olde = e;
            for (let j = 0; j < 80; j++) // 对每个512位进行80步操作
            {
                if (j < 16)
                    w[j] = x[i + j];
                else
                    w[j] = this.rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
                let t = this.safe_add(this.safe_add(this.rol(a, 5), this.sha1_ft(j, b, c, d)), this.safe_add(this.safe_add(e, w[j]), this.sha1_kt(j)));
                e = d;
                d = c;
                c = this.rol(b, 30);
                b = a;
                a = t;
            }
            a = this.safe_add(a, olda);
            b = this.safe_add(b, oldb);
            c = this.safe_add(c, oldc);
            d = this.safe_add(d, oldd);
            e = this.safe_add(e, olde);
        }
        return new Array(a, b, c, d, e);
    }

    sha1_ft(t, b, c, d) {
        if (t < 20)
            return (b & c) | ((~b) & d);
        if (t < 40)
            return b ^ c ^ d;
        if (t < 60)
            return (b & c) | (b & d) | (c & d);
        return b ^ c ^ d; // t<80
    }

    sha1_kt(t) {
        return (t < 20) ? 1518500249 : (t < 40) ? 1859775393 : (t < 60) ? -1894007588 : -899497514;
    }

    safe_add(x, y) {
        let lsw = (x & 0xFFFF) + (y & 0xFFFF);
        let msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return (msw << 16) | (lsw & 0xFFFF);
    }

    rol(num, cnt) {
        return (num << cnt) | (num >>> (32 - cnt));
    }

    AlignSHA1(str) {
        let i = 0;
        let nblk = ((str.length + 8) >> 6) + 1,
            blks = new Array(nblk * 16);
        for (i = 0; i < nblk * 16; i++){
            blks[i] = 0;
        }
        for (i = 0; i < str.length; i++){
            blks[i >> 2] |= str.charCodeAt(i) << (24 - (i & 3) * 8);
        }
        blks[i >> 2] |= 0x80 << (24 - (i & 3) * 8);
        blks[nblk * 16 - 1] = str.length * 8;
        return blks;
    }

    binb2hex(binarray) {
        let hex_tab = "0123456789abcdef";
        let str = "";
        for (let i = 0; i < binarray.length * 4; i++) {
            str += hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8 + 4)) & 0xF) +
                hex_tab.charAt((binarray[i >> 2] >> ((3 - i % 4) * 8)) & 0xF);
        }
        return str;
    }

}


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
        this._crypto = new crypto();
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

    get_out_id(){
        return this._out_id;
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
            let send_data = {out_id:out_id};
            send_data.sign = this._crypto.sha1(generateSign(send_data, "xklunkjdd"));
            console.log("send_data:",send_data);
            let headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            };
            return this._ajax.post(send_data,url+"/12133/reloginOutside", headers).then((data_received)=>{
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
            let send_data = {out_id:out_id};
            send_data.sign = this._crypto.sha1(generateSign(send_data, "xklunkjdd"));
            console.log("send_data:",send_data);
            let headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            };
            return this._ajax.post(send_data, url+"/12133/loginOutside", headers).then((data_received)=>{
                console.log("log_ret:",data_received);
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
    let signature = p_str + secret;
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