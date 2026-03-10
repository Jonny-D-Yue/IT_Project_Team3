# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy project files and restore
COPY EaterAI.Shared/EaterAI.Shared.csproj EaterAI.Shared/
COPY EaterAI.API/EaterAI.API.csproj EaterAI.API/
RUN dotnet restore EaterAI.API/EaterAI.API.csproj

# Copy source and publish
COPY EaterAI.Shared/ EaterAI.Shared/
COPY EaterAI.API/ EaterAI.API/
RUN dotnet publish EaterAI.API/EaterAI.API.csproj -c Release -o /app/publish --no-restore

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Create wwwroot directories for static file serving
RUN mkdir -p wwwroot/images/dishes wwwroot/images/restaurants

COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:10000
ENV ASPNETCORE_ENVIRONMENT=Production

EXPOSE 10000

ENTRYPOINT ["dotnet", "EaterAI.API.dll"]
