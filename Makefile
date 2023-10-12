.PHONY: test
test: 
	k6 run ./main.js -e LOG=true

.PHONY: stress
stress: 
	sysctl -w net.ipv4.ip_local_port_range="1024 65535"
	sysctl -w net.ipv4.tcp_tw_reuse=1
	sysctl -w net.ipv4.tcp_timestamps=1
	ulimit -n 250000
	k6 run ./main.js -s 3m:300  -s 30m:300