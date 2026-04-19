import re

super_html_path = r'c:\Users\SAI VIDULA\OneDrive\Desktop\Workforce-Analytics-System\backend\backend\src\main\resources\static\supervisor-dashboard.html'
mgr_html_path = r'c:\Users\SAI VIDULA\OneDrive\Desktop\Workforce-Analytics-System\backend\backend\src\main\resources\static\manager-dashboard.html'

with open(super_html_path, 'r', encoding='utf-8') as f:
    super_content = f.read()
with open(mgr_html_path, 'r', encoding='utf-8') as f:
    mgr_content = f.read()

# 1. HTML: extract supervisor directory list, replace Add Member button, replace id
match_dir = re.search(r'<!-- ═══════════ DIRECTORY TAB ═══════════ -->\s*<div id="tab-sup-directory".*?id="taskSidePanelOverlay"', super_content, re.DOTALL)
if match_dir:
    dir_html = match_dir.group(0).split('<div id="taskSidePanelOverlay"')[0].strip()
    dir_html = re.sub(r'<button onclick="openAddEmployeeModal\(\)".*?</button>', '', dir_html, flags=re.DOTALL)
    dir_html = dir_html.replace('id="tab-sup-directory"', 'id="tab-directory"')
    dir_html = dir_html.replace('id="supEmployeeDirectory"', 'id="mgrEmployeeDirectory"')
    dir_html = dir_html.replace('id="supEmpSearch"', 'id="mgrEmpSearch"')
    mgr_content = re.sub(r'<!-- ══ TEAM DIRECTORY ══ -->.*?<div id="tab-directory".*?</div>\s*</div>\s*(?=<!-- ══ ORDER ANALYTICS ══ -->)', '<!-- ══ TEAM DIRECTORY ══ -->\n    ' + dir_html + '\n\n    ', mgr_content, flags=re.DOTALL)

# 2. Extract profile overlay
match_overlay = re.search(r'<!-- Employee Profile Full Modal -->.*?<div id="empProfileOverlay".*?</div>\s*</div>\s*</div>', super_content, re.DOTALL)
if match_overlay:
    overlay_html = match_overlay.group(0).strip()
    mgr_content = re.sub(r'<!-- Employee profile modal -->\s*<div class="modal-overlay" id="empDetailsModal".*?</div>\s*</div>\s*</div>\s*</div>', overlay_html, mgr_content, flags=re.DOTALL)

# 3. Extract JS
match_js = re.search(r'// ─── Team Directory Loader ───.*?function closeEmpProfile\(\).*?\}', super_content, re.DOTALL)
if match_js:
    js_content = match_js.group(0)
    js_content = js_content.replace("document.getElementById('supEmployeeDirectory')", "document.getElementById('mgrEmployeeDirectory')")
    js_content = js_content.replace("document.getElementById('supEmpSearch')", "document.getElementById('mgrEmpSearch')")
    
    js_content += '''
    function filterEmployeeDirectory() {
        const q = (document.getElementById('mgrEmpSearch')?.value || '').toLowerCase();
        const r = document.getElementById('dirRoleFilter')?.value || '';
        const list = _empCache.filter(e => {
            const matchName = (e.username||'').toLowerCase().includes(q) || (e.employeeId||'').toLowerCase().includes(q) || (e.role||'').toLowerCase().includes(q);
            const matchRole = r ? (e.role||'').toLowerCase() === r.toLowerCase() : true;
            return matchName && matchRole;
        });
        renderEmployeeCards(list);
    }
'''

    mgr_content = re.sub(r'// ─── Team Directory ───.*?function closeEmpDetailsModal.*?\}', js_content, mgr_content, flags=re.DOTALL)

    # Finally update loadMgrDirectory to loadEmployeeDirectory in MAIN Init
    mgr_content = mgr_content.replace('loadMgrDirectory();', 'loadEmployeeDirectory();')

with open(mgr_html_path, 'w', encoding='utf-8') as f:
    f.write(mgr_content)
print("Done modifying manager config.")
