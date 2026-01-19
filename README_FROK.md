将flatnotes的保存快捷键改为crtl+s

在直接docker编译flatnotes后，在浏览器上编辑文件后可以使用Crtl+Enter 快捷键保存
但是大部分的编辑器，让我们养成了crtl+s 保存文件的习惯，本项目即将flatnotes的保存快捷键改为crtl+s

第一步：
将Crtl+Enter改为Crtl+s,修改

```
// flatnotes/client/views/Note.vue  line 474
function keydownHandler(event) {
  // Ctrl + Enter to save
  if ((event.ctrlKey || event.metaKey) && event.key == "Enter") {
    saveHandler((close = false));
  }
  // Escape to exit edit mode
  if (event.key == "Escape") {
    closeHandler();
  }
}
// 修改为
function keydownHandler(event) {
  // Ctrl + Enter to save
  if ((event.ctrlKey || event.metaKey) && event.key == "s") {
    saveHandler((close = false));
  }
  // Escape to exit edit mode
  if (event.key == "Escape") {
    closeHandler();
  }
}
```

此步骤之后，crtl+s可以保存，但同时出发下划线，需要继续修改
第二步
flatnotes的编辑器使用
`https://github.com/nhn/tui.editor/`
其中快捷键被strike占用，tui.editor是dockerbuild自动下载和编译的
需要在npm install 之后 build之前修改掉

```
# 进入源码目录
cd flatnotes
# 直接下载 toastui-editor-all.js 到当前目录
# 这里的 URL 是官方 CDN，对应最新版。如果你刚才看到的版本很老，可能需要调整 URL
wget -O my-editor.js https://uicdn.toast.com/editor/latest/toastui-editor-all.js
```

修改下载下来的 my-editor.js
现在你的目录下有个 my-editor.js，这是货真价实的 JS 源码。

```
const pcBaseKeymap = {
    "Enter": chainCommands(newlineInCode, createParagraphNear, liftEmptyBlock, splitBlock),
    "Mod-Enter": exitCode,
    "Backspace": backspace,
    "Mod-Backspace": backspace,
    "Shift-Backspace": backspace,
    "Delete": del,
    "Mod-Delete": del,
    "Mod-a": selectAll,
    "Mod-s":selectNothing,
    "Mod-S":selectNothing
};

// 增加selectNothing ，有用，能把浏览器级别的 crtl+s 屏蔽掉
const selectNothing = (state, dispatch) => {
    return true;
};
//原'Mod-s': strikeCommand  改为
return { 
        'Mod-0': strikeCommand
        };
```

修改 .dockerignore

```
echo "!my-editor.js" >> .dockerignore
```

接着修改dockerfile，将代码暗度陈仓

```
RUN npm ci
# ================= 👇 在这里插入 👇 =================
# 解释：依赖安装完了，现在把我们准备好的 "魔改版" JS 文件拷进去，覆盖官方文件
# 确保 my-editor.js 就在你的 flatnotes 源码根目录下
COPY my-editor.js node_modules/@toast-ui/editor/dist/toastui-editor-all.js
RUN sed -i 's|dist/esm/index.js|dist/toastui-editor-all.js|g' node_modules/@toast-ui/editor/package.json
# ================= 👆 插入结束 👆 =================
COPY client ./client
RUN npm run build
```

最后一步：

```
docker run -d \
  -e "PUID=1000" \
  -e "PGID=1000" \
  -e "FLATNOTES_AUTH_TYPE=password" \
  -e "FLATNOTES_USERNAME=user" \
  -e 'FLATNOTES_PASSWORD=changeMe!' \
  -e "FLATNOTES_SECRET_KEY=aLongRandomSeriesOfCharacters" \
  -v "$(pwd)/data:/data" \
  -p "8080:8080" \
  build: ./flatnotes
  #dullage/flatnotes:latest




version: "3"
services:
  flatnotes:
    container_name: flatnotes
    #image: dullage/flatnotes:latest
    build: ./flatnotes
    environment:
      PUID: 1000
      PGID: 1000
      FLATNOTES_AUTH_TYPE: "password"
      FLATNOTES_USERNAME: "user"
      FLATNOTES_PASSWORD: "changeMe!"
      FLATNOTES_SECRET_KEY: "aLongRandomSeriesOfCharacters"
    volumes:
      - "./data:/data"
      # Optional. Allows you to save the search index in a different location: 
      # - "./index:/data/.flatnotes"
    ports:
      - "8080:8080"
    restart: unless-stopped
```

```shell
docker compose up -d --no-deps --build flatnotes
```