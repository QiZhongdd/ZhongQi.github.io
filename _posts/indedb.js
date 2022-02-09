<script>
    (function () {
    // 检测 indexedDB 兼容性，因为只有新版本浏览器支持
    var DB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB;
    var supportDB = !!DB,
        db = null;
    if (supportDB) {
        var tableName = 'js-cache',
            openRequest = DB.open(tableName, 1);
        openRequest.onupgradeneeded = function(e) {
            console.log('Upgrading');
            var thisDB = e.target.result,
                store = null;
            // 解决多版本之后，objectStore 已存在问题
            if (!thisDB.objectStoreNames.contains(tableName)) {
                store = thisDB.createObjectStore(
                    tableName, {autoIncrement: true}
                );
            } else {
                store = e.currentTarget.transaction.objectStore(tableName);
            }
            // 解决多版本之后，索引存在问题
            if (store.indexNames.contains('name')) {
                store.deleteIndex('name');
            }
            store.createIndex('name', 'name', { unique: true });
        }
        openRequest.onsuccess = function(e) {
            db = e.target.result;
            downloads();
            removeCache();
        }
    } else {
        downloads();
    }
    //fake uri
    function downloads() {
        downloadScript('./static/js/chunk-vendors.04eb1.bundle.js');
    }
    // 用来记录已经被使用的缓存列表
    var cacheLists = [];
    // 获取本地缓存
    function getCache(name, callback) {
        if (!supportDB) return callback(false);
        var transaction = db.transaction([tableName], 'readonly'),
            store = transaction.objectStore(tableName),
            request = store.index('name').get(name);
        request.onsuccess = function(e) {
            var result = e.target.result;
            if(!!result) {
                cacheLists.push(name);
                callback(true, result);
            } else {
                callback(false);
            }
        }
        request.onerror = function(e) {
            callback(false);
        }
    }
    // 记录到本地缓存
    function setCache(name, data) {
        if (!supportDB) return;
        var transaction = db.transaction([tableName], 'readwrite'),
            store = transaction.objectStore(tableName),
            cache = {
                name: name,
                content: data,
                created: new Date()
            },
            request = store.add(cache);
        request.onerror = function(e) {
            console.log('Error', e.target.error.name);
        }
        request.onsuccess = function(e) {}
    }
    // 下载某个 js 脚本
    function downloadScript(name) {
        // 查找本地是否有缓存
        getCache(name, function(success, result) {
            if (success) {
                insertScriptToHead(result.content);
            } else {
                fetch(name).then(
                    data => {return data.text();}
                ).then(
                    data => {
                        setCache(name, data);
                        insertScriptToHead(data);
                    }
                ).catch(err => {
                    console.log(err);
                });
            }
        });
    }
    // 清除和更新缓存
    function removeCache() {
        if (!supportDB) return;
        var transaction = db.transaction([tableName], 'readwrite'),
            store = transaction.objectStore(tableName),
            twoWeek = 1209600000;
        store.openCursor().onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                if (cacheLists.indexOf(cursor.value.name) !== -1) {
                    cursor.value.created = new Date();
                    cursor.update(cursor.value);
                } else {
                    var now = new Date(),
                        last = cursor.value.created;
                    if (now - last > twoWeek) {
                        cursor.delete();
                    }
                }
                cursor.continue();
            }
        }
    }
    var head = document.head;
    function insertScriptToHead(scriptContent) {
        var script = document.createElement('script');
        script.innerHTML = scriptContent;
        script.type = 'text/javascript';
        head.appendChild(script);
    }
})();

  </script>