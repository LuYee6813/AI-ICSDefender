from scapy.all import PcapReader, wrpcap

# 設定輸入與輸出檔案路徑
input_pcap_path = './QueryFlooding.pcap'  # 請替換為您的 pcap 檔案路徑
output_pcap_path = 'QueryFlooding_v2.pcap'

# 定義起始封包號與結束封包號
start_packet_no = 18
end_packet_no = start_packet_no + 4  # 393302

def extract_packet_range(input_pcap, start_no, end_no, output_pcap):
    """
    從 pcap 檔案中擷取指定範圍的封包，並另存為新的 pcap 檔案。

    :param input_pcap: 原始 pcap 檔案路徑
    :param start_no: 起始封包號（從 1 開始計算）
    :param end_no: 結束封包號
    :param output_pcap: 輸出 pcap 檔案路徑
    """
    packets_to_save = []
    try:
        with PcapReader(input_pcap) as pcap_reader:
            for i, pkt in enumerate(pcap_reader, start=1):
                if start_no <= i <= end_no-1:
                    packets_to_save.append(pkt)
                if i > end_no:
                    break
        if packets_to_save:
            wrpcap(output_pcap, packets_to_save)
            print(f"封包編號 {start_no} 到 {end_no} 已成功儲存到 {output_pcap}")
        else:
            print(f"無法找到封包編號 {start_no} 到 {end_no}，請確認 pcap 檔案中是否存在該範圍的封包。")
    except FileNotFoundError:
        print(f"找不到檔案: {input_pcap}")
    except Exception as e:
        print(f"處理過程中發生錯誤: {e}")

# 執行擷取
extract_packet_range(input_pcap_path, start_packet_no, end_packet_no, output_pcap_path)
