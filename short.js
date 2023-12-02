// 获取当前连接的 HTTP 参数 "id" 存为变量 id
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

// 向 https://api.github.com/repos/HarcicYang/harcicyang.github.io/contents/short.json 发送一个请求
fetch("https://api.github.com/repos/HarcicYang/harcicyang.github.io/contents/short.json", {
  headers: {
    "If-Modified-Since": "2"
  }
})
  .then((response) => response.json())
  .then((data) => {
    // 获取 JSON 数据中 content 的值并进行 Base64 解密后转换为一个对象
    const content = atob(data.content);
    const jsonData = JSON.parse(content);

    // 从转换后的对象中获取键为 id 的项目，并获取其中键为 "url" 的参数储存为变量 url
    const item = jsonData[id];
    const url = item.url;

    // 将页面重定向到 url
    window.location.href = url;
  })
  .catch((error) => {
    // 显示错误信息并修改 h1 标签的文本内容
    alert("Error fetching data: " + error.message);
    const h1 = document.querySelector("h1");
    h1.textContent = "Error fetching data";
  });