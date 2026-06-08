#include<iostream>
#include<string>
#include<queue>
#include<unordered_map>
#include<vector>
#include<cctype>
#include<stack>


class MyCmp {
public:
	bool operator()(const std::pair<std::string, int>& p1, const std::pair<std::string, int>& p2)const
	{
		return p1.second > p2.second;
	}
};

int main()
{
	std::string text = "Computer science is the study of computers and computational systems.\
		Unlike electrical and computer engineers, computer scientists deal mostly with software\
		and software systems; this includes their theory, design, development, and application.\
		Principal areas of study within computer science include artificial intelligence,\
		computer systems and networks, security, database systems, human-computer interaction, \
		vision and graphics, numerical analysis, programming languages, software engineering,\
		bioinformatics, and theory of computing. Although many people think computer science\
		is just about programming, it is actually much more. Programming is a fundamental part of \
		computer science, but computer science is also about solving problems, designing algorithms,\
		and understanding how data is stored, processed, and communicated. Data structures,\
		such as hash tables and priority queues, are essential tools for efficient programming and algorithm design.\
		For example, a hash table allows fast lookups of data by key, while a priority queue helps\
		retrieve the smallest or largest element quickly. Understanding these data structures is critical\
		for any serious computer scientist or software developer. Computer science is not just for\
		scientists and engineers; it is for anyone who wants to learn how to think logically and solve\
		complex problems. The demand for computer science professionals continues to grow, and the skills\
		you learn in computer science can be applied to almost every field, from medicine to finance to art.";

	int k = 5;

	std::string word = "";
	std::unordered_map<std::string, int> hash;

	for (int i = 0; i < text.size(); i++)
	{
		char ch = text[i];
		ch = std::tolower(static_cast<unsigned char>(ch));  // 先转换为小写
		if (std::isalpha(ch))
		{         
			word += ch;
		}
		else if (!word.empty())
		{
			hash[word]++;
			word = "";
		}

	}

	if (word != "")
		hash[word]++;

	std::priority_queue<std::pair<std::string,int>, std::vector<std::pair<std::string,int>>, MyCmp> q;
	for (auto& val : hash)
	{
		q.push(val);
		if (q.size() > k)
			q.pop();
	}

	std::stack<std::string> stack;

	while (!q.empty())
	{
		auto pair = q.top();
		q.pop();
		stack.push(pair.first);
	}

	while (!stack.empty())
	{
		std::cout << stack.top() << std::endl;
		stack.pop();
	}



	return 0;
}