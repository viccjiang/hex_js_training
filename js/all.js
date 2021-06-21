const productList = document.querySelector('.productWrap');//抓出產品列表DOM
const productSelect = document.querySelector('.productSelect');//抓出下拉式選單DOM 做監聽 
const cartList = document.querySelector('.shoppingCart-tableList');//重複的部分拉出來寫

let productData = []; // 產品列表
let cartData = []; // 購物車列表

//初始化
function init() {
  getProductList();
  getCartList();
}
init();

//取得產品列表  6/21修改API
//https://livejs-api.hexschool.io/api/livejs/v1/customer/jiang/products
function getProductList() {
  axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/products`)
    .then(function (response) {
      productData = response.data.products;//取得產品
      renderProductList();

    })
}

// 監聽都寫在外層
// innerHTML部分在內層

// 因為重複多次，建議寫成函式，就可以直接代入這個function組字串
function combineProductHTMLItem(item) {
  //回傳return出來
  return `<li class="productCard">
        <h4 class="productType">新品</h4>
        <img
          src="${item.images}"
          alt="">
        <a href="#" class="js-addCart"  id="addCardBtn" data-id="${item.id}">加入購物車</a>
        <h3>${item.title}</h3>
        <del class="originPrice">NT$${toThousands(item.origin_price)}</del>
        <p class="nowPrice">NT$${toThousands(item.price)}</p>
      </li>`
}

//跑forEach把productData資料撈出來，組出陣列資訊做顯示
function renderProductList() {
  let str = "";
  productData.forEach(function (item) {
    str += combineProductHTMLItem(item);
  })
  productList.innerHTML = str;
}

//抓出下拉式選單DOM，做監聽
//針對 productData陣列 的八筆物件 做change事件，下拉式選單在change事件時資料做變更，category符合時顯示內容
productSelect.addEventListener('change', function (e) {
  const category = e.target.value;//取得當下狀態的value值
  if (category == "全部") { //category是全部時
    renderProductList();//顯示全部
    return;//顯示後終止
  }

  // 有重複的函式時，要盡量消除重複，讓code輕量
  // 若不是選全部而是選到別的項目時
  let str = "";
  productData.forEach(function (item) {
    if (item.category == category) { //八筆資料做change去做比對
      str += combineProductHTMLItem(item)
    }
  })
  productList.innerHTML = str;
})

// 加入購物車按鈕行為，要綁定 productList 綁監聽
productList.addEventListener("click", function (e) {
  e.preventDefault(); //取消預設默認行為
  let addCartClass = e.target.getAttribute("class");
  if (addCartClass !== "js-addCart") {
    return;
  }

  // 取出資料，加入購物車
  let productId = e.target.getAttribute("data-id");
  let numCheck = 1; //預設都是一筆資料
  cartData.forEach(function (item) {
    if (item.product.id === productId) { //目前點擊加入購物車data-id，和購物車列表的id做比對
      numCheck = item.quantity += 1;//有一樣的品項時就+=1
    }
  })

  //新增邏輯 post，要看文件後端指定的格式
  axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`, {
    "data": {
      "productId": productId,
      "quantity": numCheck
    }
  }).then(function (response) {
    alert("加入購物車");
    getCartList();//每做完一件事情後，重新render渲染購物車列表
  })
})

//取得購物車列表
function getCartList() {
  axios.get(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
    .then(function (response) {
      document.querySelector(".js-total").textContent = toThousands(response.data.finalTotal);;//抓到總金額渲染，點千分位
      cartData = response.data.carts;
      let str = "";
      cartData.forEach(function (item) {
        str += `<tr>
            <td>
              <div class="cardItem-title">
                <img src="${item.product.images}" alt="">
                <p>${item.product.title}</p>
              </div>
            </td>
            <td>NT$${toThousands(item.product.price)}</td>
            <td>${item.quantity}</td>
            <td>NT$${toThousands(item.product.price * item.quantity)}</td>
            <td class="discardBtn">
              <a href="#" class="material-icons" data-id="${item.id}">
                clear
              </a>
            </td>
          </tr>`
      });

      cartList.innerHTML = str; //顯示購物車，組字串
    })
}

//delete 刪除效果
//cartList出現重複，消除重複
cartList.addEventListener('click', function (e) {
  e.preventDefault();//取消默認行為
  const cartId = e.target.getAttribute("data-id");//取到刪除單筆購物車id
  if (cartId == null) { //要排除點到其他的地方
    alert("％％％點到其它東西了啦")
    return;
  }
  console.log(cartId);
  axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts/${cartId}`)
    .then(function (reponse) {
      alert("刪除單筆購物車成功");
      getCartList();//重新取資料重新render渲染
    })
})

// 刪除全部購物車流程
const discardAllBtn = document.querySelector(".discardAllBtn");//discardAllBtn只有在這裡出現，寫在一起就可以了
discardAllBtn.addEventListener("click", function (e) {
  e.preventDefault();//取消默認行為
  axios.delete(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/carts`)
    .then(function (response) {
      alert("刪除全部購物車成功！");
      getCartList();//重新取資料重新render渲染
    })
    .catch(function (response) {
      alert("購物車已清空，請勿重複點擊")
    })
})

// 送出訂單流程
// 送出預定資料按鈕綁監聽
const orderInfoBtn = document.querySelector(".orderInfo-btn");
orderInfoBtn.addEventListener("click", function (e) {
  e.preventDefault();//消除預設默認行為
  if (cartData.length == 0) { //先確認購物車是否有資訊
    alert("請加入購物車");
    return;
  }//抓出DOM 取出表單裡面的值
  const customerName = document.querySelector("#customerName").value;
  const customerPhone = document.querySelector("#customerPhone").value;
  const customerEmail = document.querySelector("#customerEmail").value;
  const customerAddress = document.querySelector("#customerAddress").value;
  const customerTradeWay = document.querySelector("#tradeWay").value;
  if (customerName == "" || customerPhone == "" || customerEmail == "" || customerAddress == "" || customerTradeWay == "") {
    alert("請勿輸入空資訊"); //若表單有空值空字串時就跑return
    return;
  }
  if (validateEmail(customerEmail) == false) {
    alert("請填寫正確的Email");
    return;
  }
  axios.post(`https://livejs-api.hexschool.io/api/livejs/v1/customer/${api_path}/orders`, {
    "data": {
      "user": {
        "name": customerName,
        "tel": customerPhone,
        "email": customerEmail,
        "address": customerAddress,
        "payment": customerTradeWay
      }
    }
  }).then(function (response) {
    alert("訂單建立成功");
    document.querySelector("#customerName").value = "";//訂單建立成功後，清空資料，變回空字串
    document.querySelector("#customerPhone").value = "";
    document.querySelector("#customerEmail").value = "";
    document.querySelector("#customerAddress").value = "";
    document.querySelector("#tradeWay").value = "ATM";//訂單建立成功後，初始值
    getCartList();//重新渲染
  })
})


// ----------------以下為後台--------------

const customerEmail = document.querySelector("#customerEmail");
customerEmail.addEventListener("blur", function (e) {
  if (validateEmail(customerEmail.value) == false) {
    document.querySelector(`[data-message=Email]`).textContent = "請填寫正確 Email 格式";
    return;
  }
})


// util js、元件

// 千分位數  只要跟價格有關，可加上
function toThousands(x) {
  let parts = x.toString().split(".");
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

// validate 驗證
function validateEmail(mail) {
  if (/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(mail)) {
    return true
  }
  return false;
}

// validate 驗證
function validatePhone(phone) {
  if (/^[09]{2}\d{8}$/.test(phone)) {
    return true
  }
  return false;
}
