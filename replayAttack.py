from scapy.all import rdpcap, sendp # type: ignore

# 設定要重放的pcap檔案路徑和目標網卡介面
# pcap_file = "./replay.pcap"
pcap_file = "./02-01-2023-1_from_veth460b141-0_pkt_286.pcap"
interface = "en7"

# 使用 scapy 的 rdpcap 讀取 pcap 檔案
packets = rdpcap(pcap_file)

# 使用 sendp 來重放封包到指定的網卡介面
sendp(packets, iface=interface,inter=0.0001,loop=1)  # inter參數控制每個封包間的延遲（秒），loop=0表示只發送一次
