/**
 * Study Flow Pro - VS Code Edition
 * แก้ไข: ข้อความแสดงผลเต็ม, ความคมชัด Ultra HD, รองรับการลากนิ้ว
 */

const modernColors = ['#4F46E5', '#E11D48', '#7C3AED', '#059669', '#D97706', '#2563EB', '#DC2626', '#0891B2', '#9333EA', '#EA580C'];
let usedColors = []; 
let currentSelectedColor = modernColors[0];
let isDrawing = false;

function init() {
    const datePicker = document.getElementById('datePicker');
    if (datePicker) datePicker.value = new Date().toISOString().split('T')[0];

    const timeGrid = document.getElementById('time-grid');
    if (timeGrid) {
        timeGrid.innerHTML = ''; 
        for (let h = 4; h <= 23; h++) {
            const row = document.createElement('div');
            row.className = 'time-row flex items-center py-3 border-b border-slate-50';
            row.innerHTML = `
                <div class="time-label text-[13px] font-black text-slate-600 w-16 shrink-0">${h.toString().padStart(2, '0')}:00</div>
                <div class="hour-slots flex flex-1 gap-2 h-10">
                    ${Array(6).fill(0).map(() => `
                        <div class="slot flex-1 bg-white border-2 border-slate-100 rounded-xl cursor-pointer transition-all touch-none shadow-sm" 
                             onmousedown="startPaint(this)" onmouseenter="continuePaint(this)"
                             ontouchstart="handleTouch(event)" ontouchmove="handleTouch(event)"></div>
                    `).join('')}
                </div>
            `;
            timeGrid.appendChild(row);
        }
    }

    const subjectList = document.getElementById('subject-list');
    if (subjectList) {
        subjectList.innerHTML = '';
        ['Quran', 'English', 'Academic'].forEach(n => addSubject(n));
    }

    window.onmouseup = () => isDrawing = false;
    window.ontouchend = () => isDrawing = false;
}

// --- ฟังก์ชันเพิ่ม/ลบวิชา ---
function addSubject(name) {
    const container = document.getElementById('subject-list');
    const color = getRandomColor();
    const item = document.createElement('div');
    item.className = 'subject-item flex items-center gap-4 cursor-pointer p-4 rounded-3xl transition-all border-2 border-transparent mb-3 shadow-sm group';
    
    item.onclick = () => {
        document.querySelectorAll('.subject-item').forEach(el => el.classList.remove('active', 'bg-slate-100', 'border-slate-300'));
        item.classList.add('active', 'bg-slate-100', 'border-slate-300');
        currentSelectedColor = color;
    };

    item.oncontextmenu = (e) => {
        e.preventDefault();
        if(confirm(`ต้องการลบวิชา "${name}"?`)) item.remove();
    };

    item.innerHTML = `
        <div class="w-5 h-5 rounded-full" style="background:${color}"></div>
        <span class="text-sm font-black text-slate-800 flex-1">${name}</span>
    `;
    container.appendChild(item);
    if (container.children.length === 1) item.click();
}

// --- ระบบ Export รูปภาพ (แก้ไขข้อความขาดและเพิ่มความชัด) ---
async function downloadImage() {
    const captureArea = document.getElementById('capture-area');
    const rows = document.querySelectorAll('.time-row');
    const addBtn = document.querySelector('button[onclick*="Subject"]');
    const hiddenRows = [];

    rows.forEach(row => {
        const hasColor = Array.from(row.querySelectorAll('.slot')).some(s => s.style.background !== "" && s.style.background !== "white");
        if (!hasColor) { row.style.display = 'none'; hiddenRows.push(row); }
    });

    if (addBtn) addBtn.style.visibility = 'hidden';

    const canvas = await html2canvas(captureArea, { 
        scale: 5, 
        useCORS: true,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
            // ปรับให้ Your Name และ วันที่ แสดงผลเต็มไม่โดนตัด
            const nameInput = clonedDoc.querySelector('#userName') || clonedDoc.querySelector('input[type="text"]');
            const dateInput = clonedDoc.querySelector('#datePicker');

            if (nameInput) {
                nameInput.style.height = 'auto';
                nameInput.style.minHeight = '60px';
                nameInput.style.display = 'flex';
                nameInput.style.alignItems = 'center';
                nameInput.style.fontSize = '20px';
            }

            if (dateInput) {
                const dateParent = dateInput.parentElement;
                dateParent.style.height = 'auto';
                dateParent.style.minHeight = '60px';
                dateParent.style.display = 'flex';
                dateParent.style.alignItems = 'center';
            }
            
            clonedDoc.querySelectorAll('.time-label').forEach(l => {
                l.style.color = '#000000';
                l.style.fontWeight = '900';
            });
        }
    });

    hiddenRows.forEach(row => row.style.display = 'flex');
    if (addBtn) addBtn.style.visibility = 'visible';

    const link = document.createElement('a');
    link.download = `StudyFlow-Focus.png`;
    link.href = canvas.toDataURL('image/png', 1.0);
    link.click();
}

// --- ฟังก์ชันเสริมสำหรับระบบระบายสี ---
function startPaint(el) { isDrawing = true; toggleColor(el); }
function continuePaint(el) { if (isDrawing) toggleColor(el); }
function handleTouch(e) {
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('slot')) { isDrawing = true; toggleColor(target); }
}
function toggleColor(el) {
    const activeRgb = hexToRgb(currentSelectedColor);
    if (el.style.background === activeRgb) {
        el.style.background = "white";
        el.style.borderColor = "#f1f5f9";
    } else {
        el.style.background = currentSelectedColor;
        el.style.borderColor = currentSelectedColor;
    }
    updateTotal();
}
function updateTotal() {
    const painted = Array.from(document.querySelectorAll('.slot')).filter(s => s.style.background !== "" && s.style.background !== "white");
    const mins = painted.length * 10;
    document.getElementById('totalHours').innerText = `${Math.floor(mins/60)}h ${String(mins%60).padStart(2, '0')}m`;
}
function getRandomColor() {
    if (usedColors.length === modernColors.length) usedColors = [];
    let available = modernColors.filter(c => !usedColors.includes(c));
    let res = available[Math.floor(Math.random() * available.length)];
    usedColors.push(res);
    return res;
}
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3), 16), g = parseInt(hex.slice(3,5), 16), b = parseInt(hex.slice(5,7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}
function addNewSubjectPrompt() {
    const name = prompt("ชื่อวิชาใหม่:");
    if (name) addSubject(name);
}

init();