/* ============================================================
 * 文件名称：js/ysw_tabs.js
 * 作    者：尹松旺
 * 建立时间：2026-11-02
 * 使用模型：GLM-5.3-Flash
 * 功能简介：可复用的 Tab 选项卡组件。约定结构为：
 *   [data-ysw-tabs] 容器
 *     ├── .ysw_tab-bar 内放若干 .ysw_tab-btn（data-ysw-index 对应面板序号）
 *     └── 若干 .ysw_tab-panel（默认选中者加 ysw_active）
 * 页面加载后自动初始化所有 [data-ysw-tabs] 容器；
 * 也可手动调用 ysw_initTabs(容器元素) 初始化任意数量的选项卡组。
 * ============================================================ */
(function () {
  "use strict";

  /* 函数名：ysw_clearActive
   * 作者：尹松旺  建立时间：2026-11-02  使用模型：GLM-5.3-Flash
   * 功能简介：清除一组元素上的所有选中状态（移除 ysw_active 类）。
   *           用 for 循环遍历 NodeList，是"先清空再选中"模式的前半部分。
   */
  function ysw_clearActive(ysw_elements) {
    for (var ysw_i = 0; ysw_i < ysw_elements.length; ysw_i++) {
      ysw_elements[ysw_i].classList.remove("ysw_active");
    }
  }

  /* 函数名：ysw_initTabs
   * 作者：尹松旺  建立时间：2026-11-02  使用模型：GLM-5.3-Flash
   * 功能简介：初始化一个选项卡容器（可复用核心）。
   *           1. 查询容器内所有 .ysw_tab-btn 按钮和 .ysw_tab-panel 面板；
   *           2. 在 .ysw_tab-bar 上用事件委托绑定 click 监听
   *              （addEventListener），子按钮点击时冒泡到父级统一处理；
   *           3. 处理流程：先调用 ysw_clearActive 清除所有按钮与面板的
   *              选中状态，再通过 data-ysw-index 找到当前按钮对应的面板，
   *              给"当前元素"设置 ysw_active 选中状态；
   *           4. 点击非按钮区域时直接 return，不执行任何切换。
   */
  function ysw_initTabs(ysw_container) {
    // 查询本容器内的所有按钮与面板（每个容器独立，互不影响，保证可复用）
    var ysw_btns = ysw_container.querySelectorAll(".ysw_tab-btn");
    var ysw_panels = ysw_container.querySelectorAll(".ysw_tab-panel");
    var ysw_bar = ysw_container.querySelector(".ysw_tab-bar");
    if (!ysw_bar || ysw_btns.length === 0) return;

    // 事件委托：只给按钮栏绑定一次监听，性能好且对动态新增按钮同样有效
    ysw_bar.addEventListener("click", function (ysw_event) {
      // closest 向上找被点击的选项卡按钮
      var ysw_btn = ysw_event.target.closest(".ysw_tab-btn");
      if (!ysw_btn) return;

      // 第一步：清除所有选项卡的选中状态（按钮 + 面板）
      ysw_clearActive(ysw_btns);
      ysw_clearActive(ysw_panels);

      // 第二步：设置当前元素的选中状态
      var ysw_index = ysw_btn.getAttribute("data-ysw-index");
      ysw_btn.classList.add("ysw_active");
      // 通过序号找到当前按钮对应的内容面板并选中
      if (ysw_panels[ysw_index]) {
        ysw_panels[ysw_index].classList.add("ysw_active");
      }
    });
  }

  /* 函数名：ysw_initAllTabs
   * 作者：尹松旺  建立时间：2026-11-02  使用模型：GLM-5.3-Flash
   * 功能简介：页面初始化入口。querySelectorAll 查找页面中所有带
   *           data-ysw-tabs 属性的容器，逐个调用 ysw_initTabs 完成初始化，
   *           因此同一页面可放置任意多个互不干扰的选项卡组。
   */
  function ysw_initAllTabs() {
    var ysw_groups = document.querySelectorAll("[data-ysw-tabs]");
    for (var ysw_i = 0; ysw_i < ysw_groups.length; ysw_i++) {
      ysw_initTabs(ysw_groups[ysw_i]);
    }
  }

  // DOM 就绪后自动初始化
  document.addEventListener("DOMContentLoaded", ysw_initAllTabs);

  // 对外暴露初始化函数，便于其他脚本手动创建选项卡后调用（可复用）
  window.ysw_initTabs = ysw_initTabs;
})();
