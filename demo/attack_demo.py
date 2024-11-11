import logging
logging.getLogger("scapy.runtime").setLevel(logging.ERROR)
from scapy.all import rdpcap, sendp  # type: ignore

# 打印可用的選項
print("1. ModbusQueryFlooding\n")
print("2. Reconnaissance\n")
print("3. BaseLineReplay\n")
print("4. WriteToAllCoils\n")
print("5. PayloadInjection\n")
print("6. StackModbusFrames\n")
print("7. ZeroDay\n")

# 接收使用者輸入
choice = int(input("請選擇一個攻擊 (1-7): "))

# 設定要重放的 pcap 檔案路徑和目標網卡介面
interface = "utun4"

# 不同模式使用不同的 pcap 檔案
if choice == 1:
    pcap_file = "./attack_packets/QueryFlooding.pcap"
elif choice == 2:
    pcap_file = "./attack_packets/Reconnaissance.pcap"
elif choice == 3:
    pcap_file = "./attack_packets/BaseLineReplay.pcap"
elif choice == 4:
    pcap_file = "./attack_packets/WriteToAllCoils.pcap"
elif choice == 5:
    pcap_file = "./attack_packets/PayloadInjection.pcap"
elif choice == 6:
    pcap_file = "./attack_packets/StackModbusFrames.pcap"
elif choice == 7:
    pcap_file = "./attack_packets/ZeroDay.pcap"
else:
    print("無效的選擇，請輸入 1-7 之間的數字。")
    exit()

# 使用 scapy 的 rdpcap 讀取 pcap 檔案
packets = rdpcap(pcap_file)

# 使用 sendp 來重放封包到指定的網卡介面
sendp(packets, iface=interface, inter=0.0001, loop=0)  # inter 參數控制每個封包間的延遲（秒），loop=0 表示只發送一次

print("攻擊完成！")