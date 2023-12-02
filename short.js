// 获取当前连接的 HTTP 参数 "id" 存为变量 id
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

// 定义一个 retry 函数，用于实现重试功能
function retry(func, retries = 2) {
  return new Promise((resolve, reject) => {
    func()
      .then(resolve)
      .catch((error) => {
        if (retries === 0) {
          reject(error);
        } else {
          retry(func, retries - 1)
            .then(resolve)
            .catch(reject);
        }
      });
  });
}

// 定义一个 fetchData 函数，用于获取数据
function fetchData() {
  return fetch("https://api.github.com/repos/HarcicYang/harcicyang.github.io/contents/short.json", {
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
    });
}

// 使用 retry 函数来实现出现错误时进行2次重试
retry(fetchData)
  .catch((error) => {
    // 显示错误信息并修改 h1 标签的文本内容
    alert("Error fetching data: " + error.message);
    const h1 = document.querySelector("h1");
    h1.textContent = "Error fetching data";
  });
