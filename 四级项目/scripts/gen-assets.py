# -*- coding: utf-8 -*-
"""
原生应用资源生成脚本（图标 / 启动页）
作者：24001010802 ysw
------------------------------------------------------------
图形语言与应用内一致：
  品牌蓝横向渐变（#00a9e0 → #00c2e0，同首页顶部渐变）+ 白色公文包图形。

产出分两部分：
  1. resources/                  —— 品牌源资源（可复用、可归档）
       icon.png                1024x1024  满幅应用图标
       icon-foreground.png     1024x1024  Android 自适应图标前景层（透明底）
       icon-background.png     1024x1024  Android 自适应图标背景层
       splash.png              2732x2732  启动页
  2. 原生工程切图（android/ 与 ios/ 存在时才生成）
       Android：mipmap-*dpi 各密度图标、drawable 启动页、图标背景色
       iOS    ：AppIcon.appiconset、Splash.imageset

用法：python scripts/gen-assets.py
"""
import os
import glob
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, 'resources')
ANDROID_RES = os.path.join(ROOT, 'android', 'app', 'src', 'main', 'res')
XCASSETS = os.path.join(ROOT, 'ios', 'App', 'App', 'Assets.xcassets')

BRAND_LEFT = (0x00, 0xa9, 0xe0)     # 品牌主色，同 css 变量 --ysw-primary
BRAND_RIGHT = (0x00, 0xc2, 0xe0)    # 同首页顶部渐变收尾色
SPLASH_TOP = (0x00, 0xb0, 0xe6)
SPLASH_BOTTOM = (0x00, 0x86, 0xbd)
BRAND_HEX = '#00A9E0'

SS = 4  # 超采样倍数

# Android 各密度下的图标尺寸（与 Capacitor 模板保持一致）
LEGACY_DENSITIES = {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}
FOREGROUND_DENSITIES = {'mdpi': 108, 'hdpi': 162, 'xhdpi': 216, 'xxhdpi': 324, 'xxxhdpi': 432}

# Android 启动页尺寸（与 Capacitor 模板保持一致）
SPLASH_DEFAULT = (480, 320)
SPLASH_LAND = {'mdpi': (480, 320), 'hdpi': (800, 480), 'xhdpi': (1280, 720),
               'xxhdpi': (1600, 960), 'xxxhdpi': (1920, 1280)}
SPLASH_PORT = {'mdpi': (320, 480), 'hdpi': (480, 800), 'xhdpi': (720, 1280),
               'xxhdpi': (960, 1600), 'xxxhdpi': (1280, 1920)}

written = []


def save(img, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    img.save(path)
    written.append((os.path.relpath(path, ROOT).replace('\\', '/'), img.size, img.mode))


# ---------- 图形绘制 ----------

def linear_gradient(size, c1, c2, horizontal=True):
    """生成线性渐变底图"""
    base = Image.new('RGB', (2, 2))
    px = base.load()
    if horizontal:
        px[0, 0] = c1; px[0, 1] = c1; px[1, 0] = c2; px[1, 1] = c2
    else:
        px[0, 0] = c1; px[1, 0] = c1; px[0, 1] = c2; px[1, 1] = c2
    return base.resize(size, Image.BILINEAR)


def glyph_mask(px):
    """公文包图形蒙版（0~1 归一化坐标，便于任意缩放）"""
    s = px * SS
    m = Image.new('L', (s, s), 0)
    d = ImageDraw.Draw(m)
    u = lambda v: v * s
    # 提手：圆角矩形描边
    d.rounded_rectangle([u(0.325), u(0.05), u(0.675), u(0.30)],
                        radius=u(0.105), outline=255, width=int(u(0.075)))
    # 箱体：圆角矩形填充
    d.rounded_rectangle([u(0.04), u(0.24), u(0.96), u(0.95)],
                        radius=u(0.135), fill=255)
    # 箱盖分缝：挖空，使图形读得出"公文包"结构
    d.rounded_rectangle([u(0.04), u(0.475), u(0.96), u(0.535)],
                        radius=u(0.03), fill=0)
    return m.resize((px, px), Image.LANCZOS)


def paste_glyph(canvas, ratio, color=(255, 255, 255), dy=0.0):
    """把图形按画布短边比例居中叠加（ratio 相对短边，故竖图/横图观感一致）"""
    w, h = canvas.size
    short = min(w, h)
    g = max(8, int(round(short * ratio)))
    layer = Image.new('RGB', (g, g), color)
    ox = (w - g) // 2
    oy = (h - g) // 2 + int(short * dy)
    canvas.paste(layer, (ox, oy), glyph_mask(g))
    return canvas


def icon_image(size):
    """满幅方形图标（iOS 与 Android 旧版共用造型）"""
    canvas = linear_gradient((size, size), BRAND_LEFT, BRAND_RIGHT)
    paste_glyph(canvas, 0.62, dy=0.005)
    return canvas


def rounded_icon(size, shape='rect'):
    """带圆角/圆形的图标（Android 8 以下的旧版启动器不做遮罩，需自带圆角）"""
    s = size * SS
    base = linear_gradient((s, s), BRAND_LEFT, BRAND_RIGHT)
    paste_glyph(base, 0.62, dy=0.005)
    mask = Image.new('L', (s, s), 0)
    d = ImageDraw.Draw(mask)
    if shape == 'circle':
        d.ellipse([0, 0, s - 1, s - 1], fill=255)
    else:
        d.rounded_rectangle([0, 0, s - 1, s - 1], radius=int(s * 0.18), fill=255)
    out = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    out.paste(base, (0, 0), mask)
    return out.resize((size, size), Image.LANCZOS)


def foreground_image(size):
    """Android 自适应图标前景层：透明底，图形控制在 108dp 安全区内"""
    s = size * SS
    canvas = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    paste_glyph(canvas, 0.56)
    return canvas.resize((size, size), Image.LANCZOS)


def splash_image(w, h):
    """启动页：品牌色渐变底 + 居中图形"""
    canvas = linear_gradient((w, h), SPLASH_TOP, SPLASH_BOTTOM, horizontal=False)
    paste_glyph(canvas, 0.28)
    return canvas


# ---------- 阶段一：品牌源资源 ----------

def build_resources():
    save(icon_image(1024), os.path.join(RES, 'icon.png'))
    save(foreground_image(1024), os.path.join(RES, 'icon-foreground.png'))
    save(linear_gradient((1024, 1024), BRAND_LEFT, BRAND_RIGHT),
         os.path.join(RES, 'icon-background.png'))
    save(splash_image(2732, 2732), os.path.join(RES, 'splash.png'))


# ---------- 阶段二：Android 切图 ----------

def build_android():
    if not os.path.isdir(ANDROID_RES):
        print('[gen-assets] 未发现 android/ 工程，跳过 Android 切图')
        return

    # 自适应图标背景色（主题里 @color/ic_launcher_background）
    save_bg_color = os.path.join(ANDROID_RES, 'values', 'ic_launcher_background.xml')
    with open(save_bg_color, 'w', encoding='utf-8') as f:
        f.write('<?xml version="1.0" encoding="utf-8"?>\n'
                '<resources>\n'
                f'    <color name="ic_launcher_background">{BRAND_HEX}</color>\n'
                '</resources>\n')
    written.append((os.path.relpath(save_bg_color, ROOT).replace('\\', '/'), None, 'xml'))

    # 清掉模板遗留的青色背景矢量图，避免旧资源残留
    legacy_bg = os.path.join(ANDROID_RES, 'drawable', 'ic_launcher_background.xml')
    if os.path.isfile(legacy_bg):
        with open(legacy_bg, 'w', encoding='utf-8') as f:
            f.write('<?xml version="1.0" encoding="utf-8"?>\n'
                    '<vector xmlns:android="http://schemas.android.com/apk/res/android"\n'
                    '    android:width="108dp" android:height="108dp"\n'
                    '    android:viewportWidth="108" android:viewportHeight="108">\n'
                    f'    <path android:fillColor="{BRAND_HEX}" android:pathData="M0,0h108v108h-108z"/>\n'
                    '</vector>\n')
        written.append((os.path.relpath(legacy_bg, ROOT).replace('\\', '/'), None, 'xml'))

    for dpi, size in LEGACY_DENSITIES.items():
        d = os.path.join(ANDROID_RES, f'mipmap-{dpi}')
        save(rounded_icon(size, 'rect'), os.path.join(d, 'ic_launcher.png'))
        save(rounded_icon(size, 'circle'), os.path.join(d, 'ic_launcher_round.png'))
        save(foreground_image(FOREGROUND_DENSITIES[dpi]),
             os.path.join(d, 'ic_launcher_foreground.png'))

    save(splash_image(*SPLASH_DEFAULT), os.path.join(ANDROID_RES, 'drawable', 'splash.png'))
    for dpi, size in SPLASH_LAND.items():
        save(splash_image(*size),
             os.path.join(ANDROID_RES, f'drawable-land-{dpi}', 'splash.png'))
    for dpi, size in SPLASH_PORT.items():
        save(splash_image(*size),
             os.path.join(ANDROID_RES, f'drawable-port-{dpi}', 'splash.png'))


# ---------- 阶段二：iOS 切图 ----------

def build_ios():
    appicon = os.path.join(XCASSETS, 'AppIcon.appiconset')
    splashset = os.path.join(XCASSETS, 'Splash.imageset')
    if not os.path.isdir(XCASSETS):
        print('[gen-assets] 未发现 ios/ 工程，跳过 iOS 切图')
        return

    # iOS 应用图标：1024x1024 且不能带 alpha 通道（否则 App Store 校验不通过）
    icon = icon_image(1024).convert('RGB')
    save(icon, os.path.join(appicon, 'AppIcon-512@2x.png'))

    # 启动页：模板使用同一张图对应 1x/2x/3x
    splash = splash_image(2732, 2732).convert('RGB')
    for name in ('splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'):
        save(splash, os.path.join(splashset, name))


def main():
    build_resources()
    build_android()
    build_ios()
    print(f'[gen-assets] 共生成 {len(written)} 个文件：')
    for rel, size, mode in written:
        dim = f'{size[0]}x{size[1]}' if size else '-'
        print(f'  {rel:62s} {dim:>11s} {mode}')


if __name__ == '__main__':
    main()
