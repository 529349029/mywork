package bibi;
public class BibiDecode {
public static void main(String[] args) {
  String a="";
  System.out.println(decode(a));
}
public static String decode(String a) {
	String regxstr="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";	  
	  StringBuilder after=new StringBuilder();
	  /*Character[] characters={'A','B','C','D','E','F','G','H','I','J','K','L',
	      'M','N','O','P','Q','R','S','T','U','V','W','X','Y','Z','a','b',
	      'c','d','e','f','g','h','i','j','k','l','m','n','o','p','q','r',
	      's','t','u','v','w','x','y','z'};
	  for(Character aa:characters){
	    System.out.println(aa+":"+Integer.valueOf(aa));
	  }*/
	  for (int i = 0; i <a.length(); i++) {
	    int ex=regxstr.indexOf(a.charAt(i));
	    if (ex!=-1) {
	      after.append(numToChar(Integer.valueOf(a.charAt(i))));
	    }else{
	      after.append(a.charAt(i));
	    }
	  }
	  return after.toString();
}
public static Character numToChar(int num){
  if (num==66) {
    num=90;
    return (char) num;
  }
  if (num==65) {
    num=89;
    return (char) num;
  }
  if (num==98) {
    num=122;
    return (char) num;
  }
  if (num==97) {
    num=121;
    return (char) num;
  }
  return (char) (num-2);
}
}
