## 捕魚機 Protobuf spec

### Request
* fish_request.proto: 定義 gateway/gateway.proto request type emun 
  * fish_request_data.proto: 定義了請求類型的 Data結構
  * fish_response_data.proto: 定義了請求響應的 Data結構
   
### Server Push
 #####  此類為 sever 主動 push 的資料，類型為 gateway/gateway.proto response type = `ServerPushMsg`
* fish_message.proto: 定義了捕魚遊戲 srever push 的通用格式
  * fish_message_data.proto: 定義了事件類型的 Data結構


### Common 
 ##### 定義捕魚機通用資料結構
