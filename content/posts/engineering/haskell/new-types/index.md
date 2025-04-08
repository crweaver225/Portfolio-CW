---
title: Creating New Types in Haskell
seo_title: Creating New Types in Haskell
summary:  
description: 
slug: Creating New Types in Haskell
author: Christopher Weaver

draft: false
date: 2025-03-28T09:38:32-06:00
lastmod: 2025-03-28T09:38:32-06:00
publishDate: 2025-03-28T09:38:32-06:00

feature_image: haskell_lazy.jpeg
feature_image_alt: 

categories:
- Engineering
tags:
- Haskell
series:
- Haskell

toc: true
related: true
social_share: true
newsletter: false
disable_comments: false

---

One of the most highly touted features of Haskell is its rich, strong type system. The flux in types we see in JavaScript and Python do not exist, and the implicit conversion from one type to another that we see in C/C++ is avoided as well. Haskell comes with its own set of primative types that can be leveraged to write interesting software, but often it is important for developers to be able to create their own types. Haskell has some really unique and interesting offerings for developers looking to build and utilize custom types in their programs. 

### Value Constructor
We will start by creating a value constructor, which is a special function that lets us create a new value of a certain type
```Haskell
data CarInformation = CarInformation String
```
We now have a new type called CarInformation with an String 'inhabitant'
```Haskell
myCar :: CarInformation
myCar = CarInformation "Honda Civic"
```
We can use our new type like so
```Haskell
showCar :: CarInformation -> String
showCar (CarInformation carType) = 
    "Car type: " <> carType
```
Our types can contain more than one value if we so desire
```Haskell
data CarInformation = CarInformation String String Int Int
myCar :: CarInformation
myCar = CarInformation "Honda" "Civic 2014 25
```
Our CarInformation now stores the car make, model, year, and MPG. In addition to the function above for building a function to access information, we can also utilize pattern matching
```Haskell
carMake :: CarInformation -> String
carMake (CarInformation make _ _ _ ) = make

carYear :: CarInformation -> Int
carYear (CarInformation _ _ year _) = year
```
And updating an instance of a type (say if the MPG goes down with age)
```Haskell
updateMPG :: CarInformation -> CarInformation
updateMPG (CarInformation make model year _ ) mpg =
    CarInformation make model year mpg
```

### Records
The immediate problem with what we have done so far is that we are required to know the order of values within a type when working with them. This can be challenging, particularly for types with lots of data fields within them. Luckily, Haskell has a special syntax for building types with named parameters. These are called Records
```Haskell
data CarInformation = CarInformation
{   make :: String,
    model :: String,
    year :: Int,
    mpg :: Int
}

mySecondCar :: CarInformation
mySecondCar = 
    CarInformation
    { make = "Dodge",
      model = "Stratus",
      year = 2016,
      mpg = 18
    }
```
Accessing these values because significantly more trivial and also allows us to compose really succinct functions
```Haskell
show $ year mySecondCar
-- prints: 2016

totalMpgCount :: [CarInformation] -> Int
totalMpgCount = sum . map mpg
```
The second function can take a list of CarInformation types and sum up the miles per gallon.

### Sum Types
The real value in Haskell comes from its algebraic data types, also referred to as sum types which allows us to represent between multiple different types within another type
```Haskell
data Direction = | North | East | South | West

whichDirection :: Direction -> String
whichDirection direction =
    case direction of
        North -> "North"
        East -> "East"
        South -> "South"
        West -> "West"
```
We can leverage these sum types along with our data types to create powerful abstractions
```Haskell
data PreferredContactMethod = Email String | TextMessage String | Mail String String String Int

emailContact :: PreferredContactMethod
emailContact = Email "example@example.com"

textContact :: PreferredContactMethod
textContact = TextMessage "111-111-1111"

mailContact :: PreferredContactMethod
mailContact = Mail "123 main st." "SmallVille" "Illinois" 60543
```
Similar to a variant in C++ or a union in C, this sum type allows us to generalize our work
```Haskell
confirmContact :: PreferredContactMethod -> String
confirmContact contact =
    case contact of
        Email emailAddress -> "Ok, I will email you at " <> emailAddress
        TextMessage number -> "Ok, i will text you at " <> number
        Mail street town state zipcode -> "Ok, I will send a letter to " <> street <> "\n" 
            <> town <> "\n" <> state <> "\n" <> show zipcode
```
This provides us with a data type that logically couples a bunch of different potential options that we can pass around our code without concern about what each sum type actually holds. It also allows us to store multiple different types in the same list
```Haskell
data StringOrNumber = S String | N Int

stringsAndNumbers :: [StringOrNumber]
stringsAndNumbers = 
    [
    S "this is a string",
    N 2,
    S "this is another string
    ]
```
We can combine the record types we worked through earlier with sum types as well
```Haskell
data CustomerInfo = CustomerInfo {
    customerName :: String,
    customerBalance :: Int
}
data EmployeeInfo = EmployeeInfo {
    employeeName :: String,
    employeeManagerName :: String,
    employeeSalary :: Int
}
data Person =  Customer CustomerInfo | Employee EmployeeInfo

chris = Customer $
    CustomerInfo { customerName = "Chris Weaver",
                   customerBalance = 100 }

rachel = Employee $
    EmployeeInfo { employeeName = "Rachel Weaver",
                   employeeManagerName = "Tom",
                   employeeSalary = 12 }
```
We are now ready to build out a function that can take the sum type Person and process its possible types and access the values within each type
```Haskell
getName :: Person -> String
getName person =
    case person of
        Customer customer -> customerName customer
        Employee employee -> employeeName employee
```

### Recursive Data Structures