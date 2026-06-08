#include<iostream>
#include<string>

//模拟ai返回的函数调用请求
std::string ai_response = "{\"function\":\"getWeather\",\"params\":{\"city\":\"Beijing\"}}";

//模拟执行getWeather函数
std::string getWeather(const std::string& city)
{
	//这里会调用API,但是这里只返回假数据
	return city + "的天气为晴天，气温25℃。";
}

int main()
{
	//解析ai_response，获取function名和city名
	std::string city = "Beijing";
	//根据funtion调用函数，city为参数
	std::string ans = getWeather(city);
	//打印结果
	std::cout << ans << std::endl;
	return 0;
}