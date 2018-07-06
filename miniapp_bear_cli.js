const Promise = require('./bluebird.min.js')  //我用了bluebird.js
const serverConfig = require('../config.js')
const io = require('./socket-io-map.js')
let wxPromisify = {};

wxPromisify.promisify = (fn) => {
  return function (obj = {}) {
    return new Promise((resolve, reject) => {
      obj.success = function (res) {
        resolve(res)
      }

      obj.fail = function (res) {
        reject(res)
      }

      fn(obj)
    })
  }
}

wxPromisify.promisify_special = (fn) => {
  return function (obj = {}) {
    return new Promise((resolve, reject) => {
      obj.fail = function (res) {
        reject(res)
      }
      resolve(fn(obj))
    })
  }
}

wxPromisify.promisifyAll = (wx) => {
  for (let method_name in wx) {
    //console.log(`promisify ${method_name}...`)
    switch (method_name) {
      case "connectSocket":
        wx[method_name + "Async"] = wxPromisify.promisify_special(wx[method_name]);
        break;
      default:
        if (typeof wx[method_name] == "function") {
          wx[method_name + "Async"] = wxPromisify.promisify(wx[method_name]);
        }
        break;
    }

  }
  return wx;
}

class bear_cli {
  constructor(remoteIP, remotePort, wx,router,http,util) {
    // this._wx = wxPromisify.promisifyAll(wx)
    //使用websocket
    this._route_map = {};
    this._router = router
    this._http = http
    this._util = util
    let self = this
    this._socket = io(`https://${remoteIP}`, { path: `/${remotePort}/socket.io` });
    this._socket.on('message', function (data) {
      let handler_name = `${data.handler_name}_handler`;
      if (self._handlers && self._handlers[handler_name]) {
        self._handlers[handler_name](data);
      }
    });
    this._socket.on('connect',function(data){
      console.log('user','连接成功')
      self.isConnect = true
      let route = "user.user_handler.reconnectAlive";
      return self.request(route, {});
    })
    this._socket.on('connect_failed', function (data) {
      console.log('user','连接失败')
      self.isConnect = false
    })
    this._socket.on('disconnect', function (data) {
      console.log('user','断开连接')
      self.isConnect = false
    })
    this._socket.on('reconnecting', function (data) {
      console.log('user','正在重连')
      let route = "user.user_handler.reconnectAlive";
      return self.request(route, {});
    })
    this._socket.on('connecting', function (data) {
      console.log('user','正在连接')
    })
    this._socket.on('connect_failed', function (data) {
      console.log('user','重连失败')
    })
    this._socket.on('error', function (data) {
      console.log('user','error')
    })
    this._socket.on('reconnect', function (data) {
      console.log('user','重连成功')
    })
    this._socket.on('anything', function (data) {
      console.log('user','anything')
    })
    this._handlers = {};
    this._app_socket = {};
    this._openid = "";
    this._user_id = "";
    this._token = "";
    this._expire = 0;
  }

  reset_expire() {
    this._expire = 0;
  }

  get_user_id() {
    return this._user_id;
  }

  set_user_id(user_id) {
    return new Promise(() => {
      this._user_id = user_id;
      return true;
    }).bind(this);
  }

  set_token(token, expire) {
    return new Promise(() => {
      this._token = token;
      this._expire = expire - 60000;
      return true;
    }).bind(this);
  }

  login(fb) {
    let self = this;
    wx.loginAsync().then(res => {
      return self._http.post('/8933/getOpenid', { code: res.code, weixin_id: "5b174b98a7145c61ccb8891a" })
    }).then(res => {
      if (!res.data) {
        let err_str = JSON.stringify({ error_code: "ERR_GETOPENID", msg: "获取openid出错" })
        throw new Error(err_str)
      }
      self._util.saveOpenid(res.data.data.openid)
      let openid = res.data.data ? res.data.data.openid : "";
      self._openid = openid;
      return self._http.post('/8933/checkUser', { xcx_openid: res.data.data.openid, login_as_user: 'true'})
    }).then(res => {
      if (res.statusCode == 500) {
        self._router.reToVisit()
        return
      }
      if (res.data && res.data.result == true && res.data.data) {
        //设置token和expire
        self._util.saveUserInfo(res.data.data)
        self._user_id = res.data.data.user_id;
        self._token = res.data.data.token;
        if(fb){
          fb(res.data.data)
        }
      }
      //接下来登录socket
      let route = "user.user_handler.login";
      return self.request(route, {});
    })
  }

  checkUser(fb) {
    let self = this
    if (!self._util.getOpenid()){
      self.login(fb)
      return 
    }else if(self._util.getUserInfo()){
      if (!this.newSocket){
        this.connectChat(fb)
      }
      if (fb){
        fb(self._util.getUserInfo())
      }
      return
    }
    this._http.post('/8933/checkUser', { xcx_openid: self._util.getOpenid(), login_as_user:'true'}).then(res => {
      if (res.statusCode == 500) {
        self._router.reToVisit()
        return
      }
      if (res.data && res.data.result == true && res.data.data) {
        //设置token和expire
        self._util.saveUserInfo(res.data.data)
        self._user_id = res.data.data.user_id;
        self._token = res.data.data.token;
      }
      //接下来登录socket
      let route = "user.user_handler.login";
      if (fb) {
        fb(res.data.data)
      }
      return self.request(route, {});
    })
  }

  connectChat(fb){
    this._user_id = this._util.getUserInfo().user_id || this._user_id;
    this._token = this._util.getUserInfo().token || this._token;
      //接下来登录socket
    let route = "user.user_handler.login";
    if (fb) {
      fb(this._util.getUserInfo())
    }
    return this.request(route, {});
  }
  set_handlers(handlers) {
    this._handlers = handlers;
  }

  request(route, data) {
    let self = this;
    let nowtimestamp = new Date().getTime();
    let server_type = route.split('.')[0];
    let target_socket = server_type == "user" ? this._socket : this.newSocket;
    let handler_name = route.split('.')[1];
    let method = route.split('.')[2];
    data.user_id = this._user_id;
    data.app_id = this._app_id;
    data.token = this._token;
    data.handler_name = handler_name;
    data.method = method;
    let send_msg = JSON.stringify(data);
    return target_socket.send(data);
  }

  set_route_map(route_map) {
    this._route_map = route_map;
  }

  check_app_socket() {
    for (let server_type in this._app_socket) {
      let socketTask = this._app_socket[server_type];
      if (socketTask.readyState != 1) {
        let route_map = this._route_map;
        if (route_map[server_type]) {
          //this.set_app_socket(server_type, route_map[server_type].host, route_map[server_type].port);
          //console.log(Object.keys(socketTask))
        } else {
          console.error(`route_map has no server_type: ${server_type}, reconnect fail`);
        }
      }
    }
  }

  set_app_socket(server_type, host, port) {
    if (server_type == "user"){
      return
    } else if (this.newSocket){
      return
    }
    let self = this;
    this.newSocket = io(`https://${host}`, { path: `/${port}/socket.io` });
    this.newSocket.on('message', function (data) {
      console.log(`\n[chat socket] recieve data:`, data);
      let handler_name = `${data.handler_name}_handler`;
      if (!data.handler_name){
        if (data.question_type){
          data.type = 7
          self._handlers["chat_handler"](data);
        }
      }
      if (self._handlers && self._handlers[handler_name]) {
        self._handlers[handler_name](data);
      }
    });
    this.newSocket.on('connect', function (data) {
      console.log("chat",'连接成功')
      self.isConnect = true
      let route = "chat.chat_handler.reconnectAlive";
      if (self._handlers) {
        let handler_name = "loadMoreRecord_handler"
        self._handlers[handler_name](self._user_id);
      }
      return self.request(route, {});
    })
    this.newSocket.on('connect_failed', function (data) {
      console.log("chat",'连接失败')
      self.isConnect = false
    })
    this.newSocket.on('disconnect', function (data) {
      console.log("chat",'断开连接')
      self.isConnect = false
    })
    this.newSocket.on('reconnecting', function (data) {
      console.log("chat",'正在重连')
      let route = "chat.chat_handler.reconnectAlive";
      return self.request(route, {});
    })
    this.newSocket.on('connecting', function (data) {
      console.log("chat",'正在连接')
    })
    this.newSocket.on('connect_failed', function (data) {
      console.log("chat",'重连失败')
    })
    this.newSocket.on('error', function (data) {
      console.log("chat",'error')
    })
    this.newSocket.on('reconnect', function (data) {
      console.log("chat",'重连成功')
    })
    this.newSocket.on('anything', function (data) {
      console.log("chat",'anything')
    })
  }
}

module.exports = bear_cli;