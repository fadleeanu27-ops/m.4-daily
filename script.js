/**
 * Study Flow Pro - UI & Save Engine Stable
 * แก้ไข: ระบบ Save/Export ให้ทำงานได้จริงบนมือถือและไอแพด
 */

const modernColors = ['#4F46E5', '#E11D48', '#7C3AED', '#059669', '#D97706', '#2563EB', '#DC2626', '#0891B2', '#9333EA', '#EA580C'];
let usedColors = []; 
let currentSelectedColor = modernColors[0];
let isDrawing = false;

// --- 1. เริ่มต้นระบบ ---
function init() {
    const datePicker = document.getElementById('datePicker');
    if (datePicker) datePicker.value = new Date().toISOString().split('T')[0];

    buildTimeGrid();
    setupDefaultSubjects();
    
    // ตั้งค่า Event ปล่อยนิ้ว/เมาส์ ทั่วทั้งหน้าจอ
    window.addEventListener('mouseup', () => isDrawing = false);
    window.addEventListener('touchend', () => isDrawing = false);
}

function buildTimeGrid() {
    const timeGrid = document.getElementById('time-grid');
    if (!timeGrid) return;
    timeGrid.innerHTML = ''; 
    for (let h = 4; h <= 23; h++) {
        const row = document.createElement('div');
        row.className = 'time-row flex items-center py-3 border-b border-slate-50';
        row.innerHTML = `
            <div class="time-label text-[13px] font-black text-slate-500 w-16 shrink-0">${h.toString().padStart(2, '0')}:00</div>
            <div class="hour-slots flex flex-1 gap-2 h-10">
                ${Array(6).fill(0).map(() => `
                    <div class="slot flex-1 bg-white border-2 border-slate-100 rounded-xl cursor-pointer transition-all touch-none shadow-sm" 
                         onmousedown="startPaint(this)" onmouseenter="continuePaint(this)"
                         ontouchstart="handleTouchStart(event, this)" ontouchmove="handleTouchMove(event)"></div>
                `).join('')}
            </div>
        `;
        timeGrid.appendChild(row);
    }
}

// --- 2. ระบบระบายสี ---
function handleTouchStart(e, el) { isDrawing = true; toggleColor(el); }
function handleTouchMove(e) {
    if (!isDrawing) return;
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (target && target.classList.contains('slot')) toggleColor(target);
}
function startPaint(el) { isDrawing = true; toggleColor(el); }
function continuePaint(el) { if (isDrawing) toggleColor(el); }

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

// --- 3. ระบบ Save และ Export (ปุ่มใช้งานได้จริง) ---

// ฟังก์ชันบันทึกข้อมูลลง History (LocalStorage)
function saveToHistory() {
    const dateVal = document.getElementById('datePicker').value;
    const totalVal = document.getElementById('totalHours').innerText;
    const nameVal = document.getElementById('userName').value || "User";

    if (totalVal === "0h 00m") {
        alert("กรุณาระบายสีตารางเวลาก่อนบันทึกครับ");
        return;
    }

    const record = { id: Date.now(), date: dateVal, total: totalVal, user: nameVal };
    let history = JSON.parse(localStorage.getItem('study_history') || '[]');
    history.unshift(record);
    localStorage.setItem('study_history', JSON.stringify(history));

    alert("บันทึกข้อมูลเรียบร้อยแล้ว!");
    if (window.renderHistory) renderHistory(); 
}

// ฟังก์ชันบันทึกเป็นรูปภาพ (Export)
async function downloadImage() {
    const captureArea = document.getElementById('capture-area');
    const rows = document.querySelectorAll('.time-row');
    const addBtn = document.querySelector('button[onclick*="Subject"]');
    const hiddenRows = [];

    // ซ่อนแถวที่ว่าง
    rows.forEach(row => {
        const hasColor = Array.from(row.querySelectorAll('.slot')).some(s => s.style.background !== "" && s.style.background !== "white");
        if (!hasColor) { row.style.display = 'none'; hiddenRows.push(row); }
    });
    if (addBtn) addBtn.style.visibility = 'hidden';

    try {
        const canvas = await html2canvas(captureArea, { 
            scale: 5, useCORS: true, backgroundColor: "#ffffff",
            onclone: (clonedDoc) => {
                const nameInp = clonedDoc.querySelector('#userName');
                const dateInp = clonedDoc.querySelector('#datePicker');
                if (nameInp) {
                    nameInp.style.fontSize = '26px';
                    nameInp.style.fontWeight = '900';
                    nameInp.style.border = 'none';
                    nameInp.style.height = 'auto';
                }
                if (dateInp) {
                    dateInp.parentElement.style.fontSize = '26px';
                    dateInp.parentElement.style.fontWeight = '900';
                }
            }
        });
        const link = document.createElement('a');
        link.download = `StudySummary-${document.getElementById('datePicker').value}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        alert("เกิดข้อผิดพลาดในการสร้างรูปภาพ");
    } finally {
        hiddenRows.forEach(row => row.style.display = 'flex');
        if (addBtn) addBtn.style.visibility = 'visible';
    }
}

// --- 4. ระบบจัดการวิชา ---
function addSubject(name) {
    const container = document.getElementById('subject-list');
    const color = getRandomColor();
    const item = document.createElement('div');
    item.className = 'subject-item flex items-center gap-4 cursor-pointer p-4 rounded-3xl transition-all border-2 border-transparent mb-3 shadow-sm';
    item.onclick = () => {
        document.querySelectorAll('.subject-item').forEach(el => el.classList.remove('active', 'bg-slate-100', 'border-slate-300'));
        item.classList.add('active', 'bg-slate-100', 'border-slate-300');
        currentSelectedColor = color;
    };
    item.oncontextmenu = (e) => {
        e.preventDefault();
        if(confirm(`ลบวิชา "${name}"?`)) item.remove();
    };
    item.innerHTML = `<div class="w-5 h-5 rounded-full" style="background:${color}"></div><span class="text-sm font-black text-slate-800">${name}</span>`;
    container.appendChild(item);
    if (container.children.length === 1) item.click();
}

// --- 5. Helpers ---
function setupDefaultSubjects() {
    const container = document.getElementById('subject-list');
    if (container && container.children.length === 0) {
        ['Quran', 'English', 'Academic'].forEach(n => addSubject(n));
    }
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
