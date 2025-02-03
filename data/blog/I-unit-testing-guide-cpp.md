---
title: 'I. Unit Testing Guide in C++: Essential Foundations'
date: '2025-01-03'
tags: ['C++', 'Testing', 'English']
draft: false
summary: 'Polymorphism is necessary for unit testing. Polymorphism combined with dependency injection allows us to perform unit tests on an artifact that depends on others without being tightly coupled to the real implementations of its dependencies.'
---

Switching from high-level languages like Java or C# to lower-level languages like C++ is an interesting challenge, and it becomes even more exciting when you not only want to write code but also test it automatically with unit tests.

This series of articles explains some things I wish I had known before starting to write unit tests in C++ projects.

I do not intend to delve deeply into unit testing itself or into basic concepts like creating test doubles with _gMock_ or setting up _GTests_. These topics are well-documented on the official website, and discussing them in detail would make this guide too lengthy.

The examples are designed for Windows using Visual Studio and the _MSBuild_ compiler, so some details may vary in other environments. However, the topics covered are environment-agnostic.

In this first article, we will discuss the essential foundations to understand before writing unit tests.

## Polymorphism Without Interfaces

Polymorphism is necessary for unit testing. **Polymorphism combined with dependency injection allows us to perform unit tests on an artifact that depends on others without being tightly coupled to the real implementations of its dependencies.**

Although C++ is an object-oriented language, it does not have the concept of interfaces as we know them in higher-level languages like C# or Java. One of the first questions that arise when working with C++ is: _How the heck do I implement polymorphism in C++?_

C++ does not have interfaces, but it does have abstract classes, and we can leverage them to apply polymorphism in our code:

![Query param](/static/images/I-unit-testing-guide-cpp/polimorfismo-diagrama.png)

**UserRepository.h**

```cpp
#include "User.h"
#include <memory>

class UserRepository
{
public:
    virtual void Save(const std::shared_ptr<User>& user) = 0;
};
```

**PostgreSqlUserRepository.h**

```cpp
#pragma once
#include "UserRepository.h"

class PostgreSqlUserRepository : public UserRepository
{
public:
    PostgreSqlUserRepository() = default;
    ~PostgreSqlUserRepository() = default;
    PostgreSqlUserRepository& operator=(const PostgreSqlUserRepository&) = delete;
    PostgreSqlUserRepository& operator=(const PostgreSqlUserRepository&&) = delete;
    PostgreSqlUserRepository(const PostgreSqlUserRepository&) = delete;
    PostgreSqlUserRepository(const PostgreSqlUserRepository&&) = delete;

    void Save(const std::shared_ptr<User>& user) override;
};
```

**PostgreSqlUserRepository.cpp**

```cpp
#include "PostgreSqlUserRepository.h"

void PostgreSqlUserRepository::Save(const std::shared_ptr<User>& user)
{
    // your PostgreSQL implementation
}
```

**UserService.h**

```cpp
#pragma once
#include <memory>

#include "UserRepository.h"

class UserService
{
public:
    UserService() = delete;
    ~UserService() = default;
    UserService& operator=(const UserService&) = delete;
    UserService& operator=(const UserService&&) = delete;
    UserService(const UserService&) = delete;
    UserService(const UserService&&) = delete;

    UserService(std::shared_ptr<UserRepository> userRepository);

    void Create(const std::shared_ptr<User>& user);

private:
    std::shared_ptr<UserRepository> _userRepository = nullptr;
};
```

**UserService.cpp**

```cpp
#include "pch.h"
#include "UserService.h"

UserService::UserService(std::shared_ptr<UserRepository> userRepository) :
    _userRepository(userRepository)
{
}

void UserService::Create(const std::shared_ptr<User>& user)
{
    // ...
}
```

With a simple factory method, we can create instances of `UserService` **using different implementations of `UserRepository`**. This is exactly what we need since we will have to instantiate the service using a fake repository for our unit tests.

It is worth noting that abstract classes are not the only way to create interfaces in C++. We could achieve similar behavior using [structures](https://www.w3schools.com/cpp/cpp_structs.asp). Most search results for "how to create interfaces in C++" use `struct` in their examples. However, in my opinion, **abstract classes are more appropriate for use as interfaces because they cannot be instantiated.**

## How to Unit Test Artifacts That Are NOT in Libraries

A common question when starting with C++ is: _How do I unit test artifacts that are in project types that are not libraries?_ For example, a console application.

Unit test projects are designed to test libraries—software components that expose their internal code to a consumer. However, console applications, for example, are compiled into an executable (`.exe` on Windows), and it is not possible to consume the code inside them directly.

There are several solutions to this problem, but the most widely adopted approach is to separate the code you want to test into a library that is then linked to the application. We can call this _the application’s library_. This way, both the application and the test project use the library.

![Query param](/static/images/I-unit-testing-guide-cpp/testing-non-libs-projects.png)
