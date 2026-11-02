/* ============================================================
 * 文件名称：js/ysw_rank.js
 * 作    者：尹松旺
 * 建立时间：2026-11-02
 * 使用模型：GLM-5.3-Flash
 * 功能简介：新闻排行榜渲染脚本。包含点击排行与评论排行两组数据，
 *           通过 ysw_renderRank 用 createElement 逐行动态生成榜单，
 *           前三名排名数字分别使用红/橙/黄高亮（ysw_r1/r2/r3），
 *           数值列统一红色显示。页面加载后自动渲染两个面板。
 * ============================================================ */
(function () {
  "use strict";

  /* 数据源：点击排行（标题与点击量取自课堂测试截图） */
  var ysw_clickList = [
    { ysw_title: "中国各城市房子还要卖多少年（详细数据）", ysw_count: 187706 },
    { ysw_title: "任志强：80多年来 我不知道国企给了我们", ysw_count: 171180 },
    { ysw_title: "三精制药跳楼总裁被查 或牵出华润窝案", ysw_count: 127631 },
    { ysw_title: "内地17省铺开不动产统一登记职责整合工作", ysw_count: 113685 },
    { ysw_title: "山西煤老板抛售整套59套二手房 8年投资翻倍", ysw_count: 72770 },
    { ysw_title: "北京城南楼市\u201c抢跑\u201d变相降价措施加码", ysw_count: 82971 },
    { ysw_title: "中国3D打印技术取得重大突破 近1200人围观", ysw_count: 27456 },
    { ysw_title: "重磅利空突至全球暴跌 A股或黑周五无悬念", ysw_count: 25322 },
    { ysw_title: "七匹狼早盘上演奇葩一幕：单笔4手买单刷屏", ysw_count: 20912 },
    { ysw_title: "长油小股东王导骂东大合 当场解雇董事长", ysw_count: 11667 }
  ];

  /* 数据源：评论排行（第二选项卡数据） */
  var ysw_commentList = [
    { ysw_title: "专家解读：延迟退休方案或将分步实施", ysw_count: 96423 },
    { ysw_title: "多地出台楼市新政 首付比例再度下调", ysw_count: 85217 },
    { ysw_title: "高校学费调整听证会引热议 家长观点分化", ysw_count: 71358 },
    { ysw_title: "网约车新规征求意见 司机准入门槛提高", ysw_count: 66890 },
    { ysw_title: "养老金入市方案获批 千亿资金待命", ysw_count: 52744 },
    { ysw_title: "独生子女护理假落地 谁来买单成焦点", ysw_count: 47803 },
    { ysw_title: "城市垃圾分类强制推行 你准备好了吗", ysw_count: 39561 },
    { ysw_title: "小区物业费调价风波：业主与物业的博弈", ysw_count: 31547 },
    { ysw_title: "电动自行车新国标实施 过渡期如何处理", ysw_count: 24876 },
    { ysw_title: "景区门票涨价听证 限流措施同步出台", ysw_count: 18792 }
  ];

  /* 函数名：ysw_rankClass
   * 作者：尹松旺  建立时间：2026-11-02  使用模型：GLM-5.3-Flash
   * 功能简介：根据榜单名次返回排名数字的样式类名。前三名依次为
   *           ysw_r1（红）、ysw_r2（橙）、ysw_r3（黄），第 4 名起
   *           返回空字符串，使用默认灰色样式。
   */
  function ysw_rankClass(ysw_index) {
    if (ysw_index === 0) return " ysw_r1";
    if (ysw_index === 1) return " ysw_r2";
    if (ysw_index === 2) return " ysw_r3";
    return "";
  }

  /* 函数名：ysw_renderRank
   * 作者：尹松旺  建立时间：2026-11-02  使用模型：GLM-5.3-Flash
   * 功能简介：把数据数组渲染成榜单。forEach 遍历数据，每行用
   *           createElement 创建三个节点：排名数字（加 ysw_rankClass
   *           高亮类）、标题（超长省略号截断）、数值（红色显示），
   *           依次 appendChild 到列表容器中。
   */
  function ysw_renderRank(ysw_boxId, ysw_data) {
    var ysw_box = document.getElementById(ysw_boxId);
    if (!ysw_box) return;
    ysw_data.forEach(function (ysw_item, ysw_i) {
      var ysw_row = document.createElement("div");
      ysw_row.className = "ysw_rank-row";

      // 排名数字：第 1~3 名分别使用红/橙/黄高亮
      var ysw_num = document.createElement("span");
      ysw_num.className = "ysw_rank-num" + ysw_rankClass(ysw_i);
      ysw_num.textContent = ysw_i + 1;

      // 新闻标题：超长时省略号截断
      var ysw_title = document.createElement("span");
      ysw_title.className = "ysw_rank-title";
      ysw_title.textContent = ysw_item.ysw_title;
      ysw_title.title = ysw_item.ysw_title; // 鼠标悬停显示完整标题

      // 数值列：点击量 / 评论数，统一红色
      var ysw_count = document.createElement("span");
      ysw_count.className = "ysw_rank-count";
      ysw_count.textContent = ysw_item.ysw_count;

      ysw_row.appendChild(ysw_num);
      ysw_row.appendChild(ysw_title);
      ysw_row.appendChild(ysw_count);
      ysw_box.appendChild(ysw_row);
    });
  }

  /* 函数名：ysw_initRank
   * 作者：尹松旺  建立时间：2026-11-02  使用模型：GLM-5.3-Flash
   * 功能简介：初始化入口。分别渲染"点击排行"与"评论排行"两个面板，
   *           由 DOMContentLoaded 触发，保证挂载节点已存在。
   */
  function ysw_initRank() {
    ysw_renderRank("ysw_clickList", ysw_clickList);
    ysw_renderRank("ysw_commentList", ysw_commentList);
  }

  document.addEventListener("DOMContentLoaded", ysw_initRank);
})();
