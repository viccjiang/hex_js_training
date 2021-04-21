let orderData = []; //空陣列拿來放orders新的資料
const orderList = document.querySelector(".js-orderList") //抓取訂單DOM

//初始化資料
function init() {
  getOrderList();
}
init();

// C3圖表
function renderC3() {
  console.log(orderData);
  // 物件資料蒐集
  let total = {};//空物件
  //針對orderData跑資料
  orderData.forEach(function (item) {
    item.products.forEach(function (productItem) {
      if (total[productItem.category] == undefined) {
        total[productItem.category] = productItem.price * productItem.quantity;
      } else {
        total[productItem.category] += productItem.price * productItem.quantity;
      }
    })
  })
  console.log(total);
  // 做出資料關聯
  let categoryAry = Object.keys(total);
  console.log(categoryAry);
  let newData = [];
  categoryAry.forEach(function (item) {
    let ary = [];
    ary.push(item);
    ary.push(total[item]);
    newData.push(ary);
  })
  console.log(newData);
  // C3.js
  let chart = c3.generate({
    bindto: '#chart', // HTML 元素綁定
    data: {
      type: "pie",
      columns: newData,
    },
  });
}

// 設計前三名與其他（第四名後的加總）
// 做圓餅圖  做全品項營收比重  類別包含  篩選出前三名營收品項  其他都統整為其他
function renderC3_lv2() {
  //資料蒐集 取得資料 C3要的格式
  let obj = {};
  orderData.forEach(function (item) {
    item.products.forEach(function (productItem) {
      if (obj[productItem.title] === undefined) {
        obj[productItem.title] = productItem.quantity * productItem.price;
      } else {
        obj[productItem.title] += productItem.quantity * productItem.price;

      }
    })
  });
  console.log(obj);

  // 拉出資料關聯
  let originAry = Object.keys(obj);
  console.log(originAry);
  // 透過 originAry，整理成 C3 格式
  // sort 排序用法 由高到低或由低到高
  let rankSortAry = [];

  originAry.forEach(function (item) {
    let ary = [];
    ary.push(item);
    ary.push(obj[item]);
    rankSortAry.push(ary);
  });
  console.log(rankSortAry);
  // 比大小，降冪排列（目的：取營收前三高的品項當主要色塊，把其餘的品項加總起來當成一個色塊）
  // sort: https://developer.mozilla.org/zh-TW/docs/Web/JavaScript/Reference/Global_Objects/Array/sort
  rankSortAry.sort(function (a, b) {
    return b[1] - a[1];
  })

  // // 如果筆數超過 4 筆以上，就統整為其它
  if (rankSortAry.length > 3) {
    let otherTotal = 0;
    rankSortAry.forEach(function (item, index) {
      if (index > 2) {
        otherTotal += rankSortAry[index][1];
      }
    })
    rankSortAry.splice(3, rankSortAry.length - 1);
    rankSortAry.push(['其他', otherTotal]);

  }
  // 超過三筆後將第四名之後的價格加總起來放在 otherTotal
  // c3 圖表
  c3.generate({
    bindto: '#chart',
    data: {
      columns: rankSortAry,
      type: 'pie',
    },
    color: {
      pattern: ["#301E5F", "#5434A7", "#9D7FEA", "#DACBFF"]
    }
  });
}

function getOrderList() {
  axios.get(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`, {
    headers: {
      'Authorization': token,//代入金鑰
    }
  })
    .then(function (response) {
      orderData = response.data.orders;//取得資料
      let str = '';
      orderData.forEach(function (item) { //跑forEach組資料顯示資料到表格裡
        // 組時間字串
        const timeStamp = new Date(item.createdAt * 1000); //乘上1000毫秒 會變成13碼  new Date要搭配13碼
        const orderTime = `${timeStamp.getFullYear()}/${timeStamp.getMonth() + 1}/${timeStamp.getDate()}`;//組出想要的時間格式結構，getMonth要+1
        // 組產品字串
        let productStr = "";
        item.products.forEach(function (productItem) {
          productStr += `<p>${productItem.title}x${productItem.quantity}</p>` //產品x數量
        })
        // 判斷訂單處理狀態
        let orderStatus = "";
        if (item.paid == true) { //paid付款狀態
          orderStatus = "已處理"
        } else {
          orderStatus = "未處理"
        }
        // 組訂單字串
        str += `<tr>
          <td>${item.id}</td>
          <td>
            <p>${item.user.name}</p>
            <p>${item.user.tel}</p>
          </td>
          <td>${item.user.address}</td>
          <td>${item.user.email}</td>
          <td>
            ${productStr}
          </td>
          <td>${orderTime}</td>
          <td class=" js-orderStatus">
            <a href="#" data-status="${item.paid}" class="orderStatus" data-id="${item.id}">${orderStatus}</a>
          </td>
          <td>
            <input type="button" class="delSingleOrder-Btn js-orderDelete" data-id="${item.id}" value="刪除">
          </td>
        </tr>`
      })
      orderList.innerHTML = str;//組字串顯示
      renderC3_lv2();
    })
}

// 訂單狀態＆刪除的操作按鈕 主要會取到這兩個值 data-status js-orderDelete  
orderList.addEventListener("click", function (e) {
  e.preventDefault();//消除默認行為 擋跳轉
  const targetClass = e.target.getAttribute("class");//抓出DOM，目前點這個東西，這個東西的class是什麼
  let id = e.target.getAttribute("data-id");
  if (targetClass == "delSingleOrder-Btn js-orderDelete") { //點擊到刪除按鈕 執行刪除訂單
    deletOrderItem(id)
    return;
  }
  if (targetClass == "orderStatus") { //點擊到訂單狀態  執行訂單狀態
    let status = e.target.getAttribute("data-status");

    changeOrderStatus(status, id)
    return;
  }
})

//變更訂單狀態
function changeOrderStatus(status, id) {
  console.log(status, id);
  let newStatus;
  //改狀態 已處理與未處理判斷式
  if (status == true) {
    newStatus = false;
  } else {
    newStatus = true
  }
  //更新
  axios.put(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`, {
    "data": {
      "id": id,
      "paid": newStatus
    }
  }, {
    headers: {
      'Authorization': token,
    }
  })
    .then(function (reponse) {
      alert("修改訂單成功");
      getOrderList();//重新渲染
    })
}

//刪除訂單項目
function deletOrderItem(id) {
  axios.delete(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders/${id}`, {
    headers: {
      'Authorization': token,
    }
  })
    .then(function (response) {
      alert("刪除該筆訂單成功");
      getOrderList();//重新渲染
    })

}

// 時間格式 最好是使用時間戳 UnixTimestamp
// 2020/12/3 20:00:11
// Tue Apr 13 2021 17:06:03 GMT+0800 (台北標準時間)
// 1637849503


// 刪除全部訂單
const discardAllBtn = document.querySelector(".discardAllBtn");
discardAllBtn.addEventListener("click", function (e) {
  e.preventDefault();
  axios.delete(`https://hexschoollivejs.herokuapp.com/api/livejs/v1/admin/${api_path}/orders`, {
    headers: {
      'Authorization': token,
    }
  })
    .then(function (response) {
      alert("刪除全部訂單成功");
      getOrderList(); //重新渲染
    })
})