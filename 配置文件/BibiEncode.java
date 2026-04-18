package bibi;


public class BibiEncode {
public static void main(String[] args) {
  String ori="";
  String regxstr="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  
  StringBuilder after=new StringBuilder();
  Character[] characters={'A','B','C','D','E','F','G','H','I','J','K','L',
      'M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','a','b',
      'c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r',
      's','t','u','v','w','x','y','z'};
  
  for (int i = 0; i <ori.length(); i++) {
    int ex=regxstr.indexOf(ori.charAt(i));
    if (ex!=-1) {
      after.append(numToChar(Integer.valueOf(ori.charAt(i))));
    }else{
      after.append(ori.charAt(i));
    }
  }
  System.out.println("加密之后的字符串是："+after);
  System.out.println("原始字符串是否和解密之后的字符串相等："+ori.equals(BibiDecode.decode(after.toString())));
}
public static Character numToChar(int num){
  if (num==89) {
    num=65;
    return (char) num;
  }
  if (num==90) {
    num=66;
    return (char) num;
  }
  if (num==121) {
    num=97;
    return (char) num;
  }
  if (num==122) {
    num=98;
    return (char) num;
  }
  return (char) (num+2);
}
}
