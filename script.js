document.addEventListener('DOMContentLoaded', () => {

    // ===================================================================================
    //                                  HELPER FUNCTIONS
    // ===================================================================================

    // --- Color Conversion Helpers ---
    function hexToRgb(hex) {
        let r = 0, g = 0, b = 0;
        hex = hex.replace(/^#/, '');
        if (hex.length === 3) {
            r = parseInt(hex[0] + hex[0], 16);
            g = parseInt(hex[1] + hex[1], 16);
            b = parseInt(hex[2] + hex[2], 16);
        } else if (hex.length === 6) {
            r = parseInt(hex.substring(0, 2), 16);
            g = parseInt(hex.substring(2, 4), 16);
            b = parseInt(hex.substring(4, 6), 16);
        }
        return { r, g, b };
    }

    function rgbToHex(r, g, b) {
        return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toLowerCase();
    }

    function rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        let max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        if (max === min) { h = s = 0; }
        else {
            let d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
    }

    function hslToRgb(h, s, l) {
        s /= 100; l /= 100;
        let c = (1 - Math.abs(2 * l - 1)) * s,
            x = c * (1 - Math.abs((h / 60) % 2 - 1)),
            m = l - c / 2, r = 0, g = 0, b = 0;
        if (0 <= h && h < 60) { r = c; g = x; b = 0; }
        else if (60 <= h && h < 120) { r = x; g = c; b = 0; }
        else if (120 <= h && h < 180) { r = 0; g = c; b = x; }
        else if (180 <= h && h < 240) { r = 0; g = x; b = c; }
        else if (240 <= h && h < 300) { r = x; g = 0; b = c; }
        else if (300 <= h && h < 360) { r = c; g = 0; b = x; }
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        return { r, g, b };
    }
    
    // --- General UI Helpers ---
    function copyToClipboard(element, format = 'text') {
        const target = document.getElementById(element);
        let textToCopy = target.value;
        if (format === 'rgb') textToCopy = `rgb(${textToCopy})`;
        if (format === 'hsl') textToCopy = `hsl(${textToCopy})`;
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            const btn = document.querySelector(`[data-copy-target="${element}"]`);
            const originalText = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = originalText; }, 1500);
        });
    }

    // ===================================================================================
    //                                  FEATURE 1: COLOR PICKER
    // ===================================================================================
    const pickerInput = document.getElementById('color-picker-input');
    const colorPreview = document.getElementById('color-preview');
    const hexInput = document.getElementById('hex-input');
    const rgbInput = document.getElementById('rgb-input');
    const hslInput = document.getElementById('hsl-input');

    function updateColorPicker(hexColor) {
        pickerInput.value = hexColor;
        colorPreview.style.backgroundColor = hexColor;
        const rgb = hexToRgb(hexColor);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
        hexInput.value = hexColor;
        rgbInput.value = `${rgb.r}, ${rgb.g}, ${rgb.b}`;
        hslInput.value = `${hsl.h}, ${hsl.s}%, ${hsl.l}%`;
    }

    pickerInput.addEventListener('input', (e) => updateColorPicker(e.target.value));
    hexInput.addEventListener('input', (e) => {
        if (/^#([0-9A-F]{3}){1,2}$/i.test(e.target.value)) {
            updateColorPicker(e.target.value);
        }
    });
    document.getElementById('random-color-btn').addEventListener('click', () => {
        const randomHex = rgbToHex(Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256));
        updateColorPicker(randomHex);
    });
    
    // ===================================================================================
    //                                FEATURE 2: GRADIENT GENERATOR
    // ===================================================================================
    const gradientType = document.getElementById('gradient-type');
    const gradientAngle = document.getElementById('gradient-angle');
    const stopsContainer = document.getElementById('gradient-stops');
    const gradientPreview = document.getElementById('gradient-preview');
    const cssOutput = document.getElementById('gradient-css-output');
    let colorStops = [];
    let nextStopId = 0;

    function createColorStop(hex = '#ffffff', position = -1) {
        const id = nextStopId++;
        const stopDiv = document.createElement('div');
        stopDiv.className = 'color-stop';
        stopDiv.dataset.id = id;
        position = (position === -1) ? (colorStops.length > 0 ? (colorStops.length * 50) % 101 : 0) : position;
        if(colorStops.length === 1 && position === 0) position = 100;
        
        stopDiv.innerHTML = `<input type="color" value="${hex}"><input type="range" min="0" max="100" value="${position}"><span>${position}%</span><button>X</button>`;
        stopsContainer.appendChild(stopDiv);
        const newStop = { id, div: stopDiv, color: stopDiv.querySelector('input[type="color"]'), range: stopDiv.querySelector('input[type="range"]'), label: stopDiv.querySelector('span'), removeBtn: stopDiv.querySelector('button') };
        newStop.removeBtn.addEventListener('click', () => {
            colorStops = colorStops.filter(s => s.id !== id);
            stopDiv.remove();
            updateGradient();
        });
        ['input', 'change'].forEach(evt => {
            newStop.color.addEventListener(evt, updateGradient);
            newStop.range.addEventListener(evt, () => { newStop.label.textContent = `${newStop.range.value}%`; updateGradient(); });
        });
        colorStops.push(newStop);
        updateGradient();
    }

    function updateGradient() {
        if (colorStops.length < 2) {
            gradientPreview.style.background = 'var(--input-bg)';
            cssOutput.value = 'Add at least 2 colors.';
            return;
        }
        const sortedStops = [...colorStops].sort((a, b) => a.range.value - b.range.value);
        const stopsString = sortedStops.map(s => `${s.color.value} ${s.range.value}%`).join(', ');
        const cssValue = (gradientType.value === 'linear')
            ? `linear-gradient(${gradientAngle.value}deg, ${stopsString})`
            : `radial-gradient(circle, ${stopsString})`;
        gradientPreview.style.background = cssValue;
        cssOutput.value = `background: ${cssValue};`;
    }

    document.getElementById('add-color-stop-btn').addEventListener('click', () => createColorStop(rgbToHex(~~(Math.random()*256),~~(Math.random()*256),~~(Math.random()*256))));
    [gradientType, gradientAngle].forEach(el => el.addEventListener('change', updateGradient));

    // ===================================================================================
    //                                  FEATURE 3: COLOR MIXER
    // ===================================================================================
    const mixerColor1 = document.getElementById('mixer-color-1');
    const mixerColor2 = document.getElementById('mixer-color-2');
    const mixerRatio = document.getElementById('mixer-ratio');
    const mixerPreview = document.getElementById('mixer-preview');
    const mixerCode = document.getElementById('mixer-code');

    function updateMixer() {
        const c1 = hexToRgb(mixerColor1.value);
        const c2 = hexToRgb(mixerColor2.value);
        const ratio = mixerRatio.value / 100;
        const mixedR = Math.round(c1.r * (1 - ratio) + c2.r * ratio);
        const mixedG = Math.round(c1.g * (1 - ratio) + c2.g * ratio);
        const mixedB = Math.round(c1.b * (1 - ratio) + c2.b * ratio);
        const resultHex = rgbToHex(mixedR, mixedG, mixedB);
        mixerPreview.style.backgroundColor = resultHex;
        mixerCode.textContent = resultHex;
    }
    [mixerColor1, mixerColor2, mixerRatio].forEach(el => el.addEventListener('input', updateMixer));

    // ===================================================================================
    //                                FEATURE 4: PALETTE GENERATOR
    // ===================================================================================
    const paletteBase = document.getElementById('palette-base-color');
    const paletteRule = document.getElementById('palette-rule');
    const paletteDisplay = document.getElementById('palette-display');

    function generatePalette() {
        const baseHex = paletteBase.value;
        const baseHsl = rgbToHsl(hexToRgb(baseHex).r, hexToRgb(baseHex).g, hexToRgb(baseHex).b);
        const { h, s, l } = baseHsl;
        let palette = [baseHex];

        switch (paletteRule.value) {
            case 'complementary':
                palette.push(hslToHex((h + 180) % 360, s, l));
                break;
            case 'analogous':
                palette.push(hslToHex((h + 30) % 360, s, l), hslToHex((h - 30 + 360) % 360, s, l));
                break;
            case 'triadic':
                palette.push(hslToHex((h + 120) % 360, s, l), hslToHex((h + 240) % 360, s, l));
                break;
            case 'split-complementary':
                palette.push(hslToHex((h + 150) % 360, s, l), hslToHex((h + 210) % 360, s, l));
                break;
            case 'monochromatic':
                palette = [
                    hslToHex(h, s, Math.min(100, l + 20)),
                    hslToHex(h, s, Math.min(100, l + 10)),
                    baseHex,
                    hslToHex(h, s, Math.max(0, l - 10)),
                    hslToHex(h, s, Math.max(0, l - 20)),
                ];
                break;
        }
        displayPalette(palette);
    }
    function hslToHex(h, s, l) { return rgbToHex(hslToRgb(h, s, l).r, hslToRgb(h, s, l).g, hslToRgb(h, s, l).b); }
    function displayPalette(palette) {
        paletteDisplay.innerHTML = '';
        palette.forEach(color => {
            const swatch = document.createElement('div');
            swatch.className = 'palette-swatch';
            swatch.style.backgroundColor = color;
            swatch.textContent = color;
            swatch.addEventListener('click', () => updateColorPicker(color));
            paletteDisplay.appendChild(swatch);
        });
    }
    [paletteBase, paletteRule].forEach(el => el.addEventListener('input', generatePalette));
    
    // ===================================================================================
    //                             FEATURE 5: CONTRAST CHECKER
    // ===================================================================================
    const contrastFg = document.getElementById('contrast-fg');
    const contrastBg = document.getElementById('contrast-bg');
    const contrastPreview = document.getElementById('contrast-preview');
    const ratioDisplay = document.getElementById('contrast-ratio');
    const aaDisplay = document.getElementById('wcag-aa');
    const aaaDisplay = document.getElementById('wcag-aaa');

    function getLuminance(hex) {
        const { r, g, b } = hexToRgb(hex);
        const a = [r, g, b].map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    }
    function updateContrast() {
        const fgColor = contrastFg.value;
        const bgColor = contrastBg.value;
        contrastPreview.style.color = fgColor;
        contrastPreview.style.backgroundColor = bgColor;
        const lum1 = getLuminance(fgColor);
        const lum2 = getLuminance(bgColor);
        const ratio = lum1 > lum2 ? (lum1 + 0.05) / (lum2 + 0.05) : (lum2 + 0.05) / (lum1 + 0.05);
        ratioDisplay.textContent = ratio.toFixed(2);
        
        // AA: 4.5, AAA: 7.0 for normal text
        updateStatus(aaDisplay, ratio >= 4.5);
        updateStatus(aaaDisplay, ratio >= 7);
    }
    function updateStatus(el, pass) {
        el.textContent = pass ? 'Pass' : 'Fail';
        el.className = pass ? 'pass' : 'fail';
    }
    [contrastFg, contrastBg].forEach(el => el.addEventListener('input', updateContrast));
    
    // ===================================================================================
    //                                 GLOBAL & CREATIVE FEATURES
    // ===================================================================================
    
    // --- Theme Toggle ---
    const themeToggle = document.getElementById('theme-toggle');
    themeToggle.addEventListener('change', () => {
        const theme = themeToggle.checked ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('color-toolkit-theme', theme);
    });

    // --- Background Chooser ---
    document.getElementById('apply-solid-bg').addEventListener('click', () => { document.body.style.background = pickerInput.value; });
    document.getElementById('apply-gradient-bg').addEventListener('click', () => { document.body.style.background = gradientPreview.style.background; });
    document.getElementById('reset-bg').addEventListener('click', () => { document.body.style.background = ''; });

    // --- Inter-tool Communication ---
    document.getElementById('picker-to-tools-btn').addEventListener('click', () => {
        const color = pickerInput.value;
        mixerColor1.value = color;
        paletteBase.value = color;
        contrastFg.value = color;
        updateMixer();
        generatePalette();
        updateContrast();
    });

    // --- General Copy Buttons ---
    document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            copyToClipboard(btn.dataset.copyTarget, btn.dataset.copyFormat);
        });
    });

    // --- Secret Section Reveal (Click Title) ---
    let titleClicks = 0;
    let titleClickTimer = null;
    document.getElementById('main-title').addEventListener('click', () => {
        titleClicks++;
        clearTimeout(titleClickTimer);
        titleClickTimer = setTimeout(() => { titleClicks = 0; }, 2000);
        if (titleClicks === 7) {
            document.getElementById('secret-info-section').classList.remove('hidden');
            titleClicks = 0;
        }
    });

    // --- Konami Code Easter Egg ---
    const konamiCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
    let userInput = [];
    let discoInterval = null;
    const discoDiv = document.getElementById('secret-disco');
    window.addEventListener('keydown', (e) => {
        userInput.push(e.key);
        userInput.splice(-konamiCode.length - 1, userInput.length - konamiCode.length);
        if (userInput.join('') === konamiCode.join('')) {
            discoDiv.classList.remove('hidden');
            if(discoInterval) return;
            discoInterval = setInterval(() => { document.body.style.background = rgbToHex(~~(Math.random()*256),~~(Math.random()*256),~~(Math.random()*256))}, 400);
        }
    });
    document.getElementById('stop-disco-btn').addEventListener('click', () => {
        clearInterval(discoInterval);
        discoInterval = null;
        discoDiv.classList.add('hidden');
        document.body.style.background = '';
    });
    
    // ===================================================================================
    //                                    INITIALIZATION
    // ===================================================================================
    // Load saved theme
    const savedTheme = localStorage.getItem('color-toolkit-theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    // Initial tool states
    updateColorPicker(pickerInput.value);
    createColorStop('#3498db', 0);
    createColorStop('#e94560', 100);
    updateMixer();
    generatePalette();
    updateContrast();
});
