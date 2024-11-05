from scapy.all import rdpcap, wrpcap, IP, TCP, Raw
from copy import deepcopy

# 定義輸入和輸出 pcap 文件路徑
input_pcap = 'QueryFlooding_v2.pcap'          # 原始 pcap 文件
output_pcap = 'Modified_QueryFlooding_v2.pcap'  # 修改後的 pcap 文件

# 讀取 pcap 文件
packets = rdpcap(input_pcap)

# 提取 Modbus 查詢封包（假設是第一個 TCP 封包且包含 Raw 層）
modbus_packet = None
for pkt in packets:
    if TCP in pkt and Raw in pkt:
        modbus_packet = pkt
        break

if modbus_packet is None:
    print("未找到 Modbus 查詢封包。請確認 pcap 文件中存在 TCP 且包含 Raw 層的封包。")
    exit(1)

# 提取原始 Transaction ID
original_tid = modbus_packet[IP].id

# 準備儲存修改後的封包
modified_packets = []

for i in range(32):
    # 深拷貝原始封包
    new_pkt = deepcopy(modbus_packet)
    
    # 修改 Transaction ID
    new_tid = original_tid + i + 1  # 從 Transaction ID +1 開始
    new_pkt[IP].id = new_tid
    
    # 刪除校驗和，讓 Scapy 自動重新計算
    del new_pkt[IP].chksum
    del new_pkt[TCP].chksum
    
    # 添加到修改後的封包列表
    modified_packets.append(new_pkt)

# 寫入新的 pcap 文件
wrpcap(output_pcap, modified_packets)

print(f"已成功生成 {len(modified_packets)} 個修改後的封包，並儲存至 {output_pcap}")
