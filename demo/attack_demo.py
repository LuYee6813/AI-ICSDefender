import logging
logging.getLogger("scapy.runtime").setLevel(logging.ERROR)
from scapy.all import rdpcap, sendp  # type: ignore


# 設定要重放的 pcap 檔案路徑和目標網卡介面
interface = "en6"

# 0 WriteToAllCoils
# 1 QueryFlooding
# 2 PayloadInjection
# 3 StackModbusFrames
# 4 Reconnaissance
# 5 BaseLineReplay
# 6 ZeroDay

# 直到按下crtl+c結束程式
while True:
    # 打印可用的選項
    print("0 WriteToAllCoils")
    print("1 QueryFlooding")
    print("2 PayloadInjection")
    print("3 StackModbusFrames")
    print("4 Reconnaissance")
    print("5 BaseLineReplay")
    print("6 ZeroDay")
    choice = int(input("請選擇一個攻擊 (0-6): "))

    # 不同模式使用不同的 pcap 檔案
    if choice == 0:
        pcap_file = "./attack_packets/0.WriteToAllCoils.pcap"
    elif choice == 1:
        pcap_file = "./attack_packets/1.QueryFlooding.pcap"
    elif choice == 2:
        pcap_file = "./attack_packets/2.PayloadInjection.pcap"
    elif choice == 3:
        pcap_file = "./attack_packets/3.StackedModbusFrames.pcap"
    elif choice == 4:
        pcap_file = "./attack_packets/4.Reconnaissance.pcap"
    elif choice == 5:
        pcap_file = "./attack_packets/5.BaseLineReplay.pcap"
    elif choice == 6:
        pcap_file = "./attack_packets/ZeroDay.pcap"
    else:
        print("無效的選擇！")
        exit()

    # 使用 scapy 的 rdpcap 讀取 pcap 檔案
    packets = rdpcap(pcap_file)

    # 使用 sendp 來重放封包到指定的網卡介面
    sendp(packets, iface=interface, inter=0.0001, loop=0)  # inter 參數控制每個封包間的延遲（秒），loop=0 表示只發送一次

    print("攻擊完成！")
