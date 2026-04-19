import re

super_html_path = r'c:\Users\SAI VIDULA\OneDrive\Desktop\Workforce-Analytics-System\backend\backend\src\main\resources\static\supervisor-dashboard.html'
mgr_html_path = r'c:\Users\SAI VIDULA\OneDrive\Desktop\Workforce-Analytics-System\backend\backend\src\main\resources\static\manager-dashboard.html'

with open(super_html_path, 'r', encoding='utf-8') as f:
    super_content = f.read()

# Use proper extraction for overlay
start_str = '<!-- Employee Profile Full Modal -->'
start_idx = super_content.find(start_str)
end_str = '    <!-- Notification Container -->'
end_idx = super_content.find(end_str)

overlay_html = super_content[start_idx:end_idx].strip()

with open(mgr_html_path, 'r', encoding='utf-8') as f:
    mgr_content = f.read()

# Now find the botched overlay in manager
m_start_idx = mgr_content.find('<!-- Employee Profile Full Modal -->')
if m_start_idx == -1:
    print("Cannot find botch")
else:
    m_end_idx = mgr_content.find('<!-- Legacy compatibility -->')
    new_mgr_content = mgr_content[:m_start_idx] + overlay_html + '\n\n' + mgr_content[m_end_idx:]
    with open(mgr_html_path, 'w', encoding='utf-8') as f:
        f.write(new_mgr_content)
    print("Repaired manager profile modal.")
